import {JWT} from 'google-auth-library';
import {google} from 'googleapis';

export class GoogleUtils {
    private _jwtToken: JWT | undefined;
    private _calendar: any;
    private _admin: any;

    constructor() {
    }

    async impersonate(parameters: {
        key: string,
        email: string,
        scopes: string[],
        subject: string
    }) {
        if (!parameters ||
            !parameters.key ||
            !parameters.email ||
            !parameters.scopes ||
            !parameters.subject) {
            throw 'Invalid parameters';
        }

        this._jwtToken = await new google.auth.JWT({
            key: parameters.key,
            email: parameters.email,
            scopes: parameters.scopes,
            subject: parameters.subject
        });
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