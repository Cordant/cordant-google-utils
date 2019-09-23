"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const googleapis_1 = require("googleapis");
class GoogleUtils {
    constructor() {
    }
    impersonate(parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!parameters) {
                throw 'Invalid parameters';
            }
            this._jwtToken = yield new googleapis_1.google.auth.JWT(Object.assign({}, parameters));
        });
    }
    init(credentials, token) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!credentials || !token) {
                throw 'Invalid parameters';
            }
            this._auth = yield new googleapis_1.google.auth.OAuth2(credentials.client_id, credentials.client_secret, credentials.redirect_uris[0]);
            this._auth.setCredentials(token);
        });
    }
    createFolder(folderName, parentFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._drive) {
                this._drive = googleapis_1.google.drive({ version: 'v3', auth: this._auth });
            }
            return new Promise((resolve, reject) => {
                this._drive.files.create({
                    resource: {
                        'name': folderName,
                        parents: [parentFolder],
                        'mimeType': 'application/vnd.google-apps.folder'
                    },
                    fields: 'id'
                }, (err, file) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    }
                    else {
                        console.log('Folder Id: ', file.data.id, ' for ', folderName);
                        resolve({
                            folderName: folderName,
                            folderId: file.data.id
                        });
                    }
                });
            });
        });
    }
    countFoldersStartingWith(folderName, parentFolder) {
        if (!this._drive) {
            this._drive = googleapis_1.google.drive({ version: 'v3', auth: this._auth });
        }
        return new Promise((resolve, reject) => {
            const fileMetadata = {
                q: "'" + parentFolder + "' in parents and name contains '" + folderName + "' and mimeType='application/vnd.google-apps.folder'",
                fields: 'nextPageToken, files(id, name)',
                spaces: 'drive'
            };
            this._drive.files.list(fileMetadata, function (err, data) {
                if (err) {
                    // Handle error
                    console.error('Handle error');
                    console.error(err);
                    resolve(0);
                }
                else {
                    resolve(data.data.files.length);
                }
            });
        });
    }
    writeSpreadsheetInFolder(fileName, data, parentFolderId, color = false) {
        if (!this._drive || !this._sheets) {
            this._drive = googleapis_1.google.drive({ version: 'v3', auth: this._auth });
            this._sheets = googleapis_1.google.drive({ version: 'v4', auth: this._auth });
        }
        return new Promise((resolve, reject) => {
            this._drive.files.create({
                resource: {
                    'name': fileName,
                    parents: [parentFolderId],
                    'mimeType': 'application/vnd.google-apps.spreadsheet'
                },
                fields: 'id'
            }, (err, file) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                else {
                    console.log('File Id: ', file.data.id, ' for ', fileName);
                    this._sheets.spreadsheets.values.update({
                        spreadsheetId: file.data.id,
                        range: 'Sheet1!' + GoogleUtils.getRangeName(data.length, data.length > 0 ? data[0].length : 0),
                        valueInputOption: 'USER_ENTERED',
                        resource: { values: data },
                    }, (err) => {
                        if (err) {
                            console.log(err);
                            reject(err);
                        }
                        else {
                            resolve();
                            if (color)
                                this.updateSpreadsheets(file.data.id, data.styles);
                        }
                    });
                }
            });
        });
    }
    /* done */
    shareFolderWithContacts(folderId, emails, emailMessage) {
        if (!this._drive) {
            this._drive = googleapis_1.google.drive({ version: 'v3', auth: this._auth });
        }
        return new Promise((resolve, reject) => {
            const permissions = emails.map(x => {
                return {
                    'type': 'user',
                    'role': 'writer',
                    'emailAddress': x
                };
            });
            Promise.all(permissions.map((x, i) => new Promise((resolveI, rejectI) => {
                setTimeout(() => {
                    this._drive.permissions.create({
                        resource: x,
                        fields: 'id',
                        fileId: folderId,
                        emailMessage,
                        sendNotificationEmail: true
                    }, function (err, data) {
                        console.log(x);
                        if (err) {
                            // Handle error
                            console.error('Handle error');
                            console.error(err);
                            rejectI(err);
                        }
                        else {
                            console.log('folder shared');
                            resolveI(data.data.id.length);
                        }
                    });
                }, i * 1000);
            })))
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
    updateSpreadsheets(spreadsheetId, requestsData) {
        if (!this._sheets) {
            this._sheets = googleapis_1.google.drive({ version: 'v4', auth: this._auth });
        }
        this._sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
                batchUpdateRequest: {
                    requests: [requestsData]
                }
            },
        }, (err) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log('Sheets updated successfully!');
        });
    }
    static getRangeName(rowCount, columnCount) {
        return 'A1:' + GoogleUtils.getLastColumnName(columnCount) + rowCount;
    }
    static getLastColumnName(columnCount) {
        let temp, letter = '';
        while (columnCount > 0) {
            temp = (columnCount - 1) % 26;
            letter = String.fromCharCode(temp + 65) + letter;
            columnCount = (columnCount - temp - 1) / 26;
        }
        return letter;
    }
    getCalendarEvents(calendarId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._calendar) {
                this._calendar = googleapis_1.google.calendar('v3');
            }
            return yield new Promise((resolve, reject) => {
                this._jwtToken.authorize((err, result) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        console.trace('auth error');
                        throw err;
                    }
                    this._calendar.events.list({
                        auth: this._jwtToken, calendarId
                    }, (err, data) => {
                        if (err) {
                            return new Error('There was an error contacting the Calendar service: ' + err);
                        }
                        resolve(data);
                    });
                }));
            });
        });
    }
    createEvent(calendarId, resource) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._calendar) {
                this._calendar = googleapis_1.google.calendar('v3');
            }
            return yield new Promise((resolve, reject) => {
                this._jwtToken.authorize((err, result) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        console.trace('auth error');
                        throw err;
                    }
                    this._calendar.events.insert({
                        auth: this._jwtToken, calendarId, resource
                    }, (err, event) => {
                        if (err) {
                            return new Error('There was an error contacting the Calendar service: ' + err);
                        }
                        resolve(event.data.id);
                    });
                }));
            });
        });
    }
    deleteEvent(calendarId, eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._calendar) {
                this._calendar = googleapis_1.google.calendar('v3');
            }
            return yield new Promise((resolve, reject) => {
                this._jwtToken.authorize((err, result) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        console.trace('auth error');
                        throw err;
                    }
                    this._calendar.events.delete({
                        auth: this._jwtToken, calendarId, eventId
                    }, (err, event) => {
                        if (err) {
                            return new Error('There was an error contacting the Calendar service: ' + err);
                        }
                        resolve(`Event with id ${eventId} deleted successfully.`);
                    });
                }));
            });
        });
    }
    updateSignature(userEmail, customer, userKey, resource) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._admin) {
                this._admin = googleapis_1.google.admin('directory_v1');
            }
            return yield new Promise((resolve, reject) => {
                this._jwtToken.authorize((err, result) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        console.trace('auth error');
                        throw err;
                    }
                    this._admin.users.update({
                        auth: this._jwtToken, customer, userKey, resource
                    }, (err, response) => {
                        if (err) {
                            return new Error('There was an error contacting the Admin service: ' + err);
                        }
                        resolve(response);
                    });
                }));
            });
        });
    }
    getSignatureData(userEmail, customer, maxResults = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._admin) {
                this._admin = googleapis_1.google.admin('directory_v1');
            }
            return yield new Promise((resolve, reject) => {
                this._jwtToken.authorize((err, result) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        console.trace('auth error');
                        throw err;
                    }
                    this._admin.users.list({
                        auth: this._jwtToken, customer, maxResults, orderBy: 'email', query: `email=${userEmail}`
                    }, (err, userDetails) => {
                        if (err) {
                            return new Error('There was an error contacting the Admin service: ' + err);
                        }
                        resolve(userDetails);
                    });
                }));
            });
        });
    }
}
exports.GoogleUtils = GoogleUtils;
