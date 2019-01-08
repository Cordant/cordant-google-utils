import {JWT} from 'google-auth-library';
import {google} from 'googleapis';

export class GoogleUtils {
    private _jwtToken: JWT | undefined;
    private _calendar: any;

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
}