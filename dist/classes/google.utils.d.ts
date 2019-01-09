export declare class GoogleUtils {
    private _jwtToken;
    private _calendar;
    constructor();
    impersonate(parameters: {
        key: string;
        email: string;
        scopes: string[];
        subject: string;
    }): Promise<void>;
    createEvent(calendarId: string, resource: any): Promise<{}>;
}
