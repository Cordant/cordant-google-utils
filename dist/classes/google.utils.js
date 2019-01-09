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
            if (!parameters ||
                !parameters.key ||
                !parameters.email ||
                !parameters.scopes ||
                !parameters.subject) {
                throw 'Invalid parameters';
            }
            this._jwtToken = yield new googleapis_1.google.auth.JWT({
                key: parameters.key,
                email: parameters.email,
                scopes: parameters.scopes,
                subject: parameters.subject
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
}
exports.GoogleUtils = GoogleUtils;
