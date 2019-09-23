import { JWT, OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { CredentialModel, ImpersonateModel, TokenModel } from "../models/index.model";

export class GoogleUtils {
    private _jwtToken: JWT;
    private _auth: OAuth2Client;
    private _calendar: any;
    private _admin: any;
    private _drive: any;
    private _sheets: any;

    constructor() {
    }

    async impersonate(parameters: ImpersonateModel) {
        if (!parameters) {
            throw 'Invalid parameters';
        }
        this._jwtToken = await new google.auth.JWT({ ...parameters });
    }

    async init(credentials: CredentialModel, token: TokenModel) {
        if (!credentials || !token) {
            throw 'Invalid parameters';
        }

        this._auth = await new google.auth.OAuth2(credentials.client_id, credentials.client_secret, credentials.redirect_uris[0]);
        this._auth.setCredentials(token);
    }

    async createFolder(folderName: string, parentFolder: string): Promise<{ folderName: string, folderId: string } | any> {
        if (!this._drive) {
            this._drive = google.drive({ version: 'v3', auth: this._auth });
        }
        return new Promise((resolve, reject) => {
            this._drive.files.create({
                resource: {
                    'name': folderName,
                    parents: [ parentFolder ],
                    'mimeType': 'application/vnd.google-apps.folder'
                },
                fields: 'id'
            }, (err, file) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    console.log('Folder Id: ', file.data.id, ' for ', folderName);
                    resolve({
                        folderName: folderName,
                        folderId: file.data.id
                    });
                }
            });
        });
    }

    countFoldersStartingWith(folderName: string, parentFolder: string): Promise<number> {
        if (!this._drive) {
            this._drive = google.drive({ version: 'v3', auth: this._auth });
        }
        return new Promise((resolve, reject) => {
            const fileMetadata = {
                q: "'" + parentFolder + "' in parents and name contains '" + folderName + "' and mimeType='application/vnd.google-apps.folder'",
                fields: 'nextPageToken, files(id, name)',
                spaces: 'drive'
            };
            this._drive.files.list(fileMetadata, function (err: any, data: any) {
                if (err) {
                    // Handle error
                    console.error('Handle error');
                    console.error(err);
                    resolve(0);
                } else {
                    resolve(data.data.files.length);
                }
            });
        });
    }

    writeSpreadsheetInFolder(fileName: string, data: any, parentFolderId: string, color: boolean = false): Promise<any> {
        if (!this._drive || !this._sheets) {
            this._drive = google.drive({ version: 'v3', auth: this._auth });
            this._sheets = google.drive({ version: 'v4', auth: this._auth });
        }
        return new Promise((resolve, reject) => {
            this._drive.files.create({
                resource: {
                    'name': fileName,
                    parents: [ parentFolderId ],
                    'mimeType': 'application/vnd.google-apps.spreadsheet'
                },
                fields: 'id'
            }, (err: any, file: any) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    console.log('File Id: ', file.data.id, ' for ', fileName);

                    this._sheets.spreadsheets.values.update({
                        spreadsheetId: file.data.id,
                        range: 'Sheet1!' + GoogleUtils.getRangeName(data.length, data.length > 0 ? data[0].length : 0),
                        valueInputOption: 'USER_ENTERED',
                        resource: { values: data },
                    }, (err: any) => {
                        if (err) {
                            console.log(err);
                            reject(err);
                        } else {
                            resolve();
                            if (color) this.updateSpreadsheets(file.data.id, data.styles);
                        }
                    });
                }
            });
        });
    }
    /* done */
    shareFolderWithContacts(folderId: string, emails: string[], emailMessage: string): Promise<any> {
        if (!this._drive) {
            this._drive = google.drive({ version: 'v3', auth: this._auth });
        }
        return new Promise((resolve, reject) => {
            const permissions = emails.map(x => {
                return {
                    'type': 'user',
                    'role': 'writer',
                    'emailAddress': x
                }
            });
            Promise.all(
                permissions.map((x, i) => new Promise((resolveI, rejectI) => {
                        setTimeout(() => {
                            this._drive.permissions.create({
                                resource: x,
                                fields: 'id',
                                fileId: folderId,
                                emailMessage,
                                sendNotificationEmail: true
                            }, function (err: any, data: any) {
                                console.log(x);
                                if (err) {
                                    // Handle error
                                    console.error('Handle error');
                                    console.error(err);
                                    rejectI(err);
                                } else {
                                    console.log('folder shared');
                                    resolveI(data.data.id.length);
                                }
                            });

                        }, i * 1000)
                    })
                )
            )
                .then(() => {
                    resolve();
                })
                .catch(reject);
        });
    }

    /*
    * requestData is a list of properties for a spreadsheet e.g. coloring, auto-resizing etc..
    * Please refer to the following documentation for more properties: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/request
    * */
    updateSpreadsheets(spreadsheetId: string, requestsData: any) {
        if (!this._sheets) {
            this._sheets = google.drive({ version: 'v4', auth: this._auth });
        }
        this._sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
                batchUpdateRequest: {
                    requests: [ requestsData ]
                }
            },
        }, (err: any) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log('Sheets updated successfully!');
        });
    }

    private static getRangeName(rowCount: number, columnCount: number): string {
        return 'A1:' + GoogleUtils.getLastColumnName(columnCount) + rowCount;
    }

    private static getLastColumnName(columnCount: number) {
        let temp, letter = '';
        while (columnCount > 0) {
            temp = (columnCount - 1) % 26;
            letter = String.fromCharCode(temp + 65) + letter;
            columnCount = (columnCount - temp - 1) / 26;
        }
        return letter;
    }

    async getCalendarEvents(calendarId: string) {
        if (!this._calendar) {
            this._calendar = google.calendar('v3');
        }
        return await new Promise((resolve, reject) => {
            (this._jwtToken as JWT).authorize(async (err, result) => {
                if (err) {
                    console.trace('auth error');
                    throw err;
                }

                this._calendar.events.list({
                    auth: this._jwtToken, calendarId
                }, (err: any, data: any) => {
                    if (err) {
                        return new Error('There was an error contacting the Calendar service: ' + err);
                    }
                    resolve(data)
                })
            });
        })
    }

    async createEvent(calendarId: string, resource: any) {
        if (!this._calendar) {
            this._calendar = google.calendar('v3');
        }
        return await new Promise((resolve, reject) => {
            (this._jwtToken as JWT).authorize(async (err, result) => {
                if (err) {
                    console.trace('auth error');
                    throw err;
                }

                this._calendar.events.insert({
                    auth: this._jwtToken, calendarId, resource
                }, (err: any, event: any) => {
                    if (err) {
                        return new Error('There was an error contacting the Calendar service: ' + err);
                    }
                    resolve(event.data.id)
                });
            });
        })
    }

    async deleteEvent(calendarId: string, eventId: string) {
        if (!this._calendar) {
            this._calendar = google.calendar('v3');
        }
        return await new Promise((resolve, reject) => {
            (this._jwtToken as JWT).authorize(async (err, result) => {
                if (err) {
                    console.trace('auth error');
                    throw err;
                }

                this._calendar.events.delete({
                    auth: this._jwtToken, calendarId, eventId
                }, (err: any, event: any) => {
                    if (err) {
                        return new Error('There was an error contacting the Calendar service: ' + err);
                    }
                    resolve(`Event with id ${eventId} deleted successfully.`)
                });
            });
        })
    }

    async updateSignature(userEmail: string, customer: string, userKey: any, resource: any) {
        if (!this._admin) {
            this._admin = google.admin('directory_v1');
        }
        return await new Promise((resolve, reject) => {
            (this._jwtToken as JWT).authorize(async (err, result) => {
                if (err) {
                    console.trace('auth error');
                    throw err;
                }

                this._admin.users.update({
                    auth: this._jwtToken, customer, userKey, resource
                }, (err: any, response: any) => {
                    if (err) {
                        return new Error('There was an error contacting the Admin service: ' + err);
                    }
                    resolve(response)
                });
            });
        })
    }

    async getSignatureData(userEmail: string, customer: string, maxResults: number = 1) {
        if (!this._admin) {
            this._admin = google.admin('directory_v1');
        }
        return await new Promise((resolve, reject) => {
            (this._jwtToken as JWT).authorize(async (err, result) => {
                if (err) {
                    console.trace('auth error');
                    throw err;
                }

                this._admin.users.list({
                    auth: this._jwtToken, customer, maxResults, orderBy: 'email', query: `email=${userEmail}`
                }, (err: any, userDetails: any) => {
                    if (err) {
                        return new Error('There was an error contacting the Admin service: ' + err);
                    }
                    resolve(userDetails)
                })
            });
        })
    }
}