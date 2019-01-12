export declare class GoogleUtils {
    private _jwtToken;
    private _calendar;
    private _admin;
    constructor();
    impersonate(parameters: {
        key: string;
        email: string;
        scopes: string[];
        subject: string;
    }): Promise<void>;
    createEvent(calendarId: string, resource: any): Promise<{}>;
    deleteEvent(calendarId: string, eventId: string): Promise<{}>;
    updateSignature(userEmail: string, customer: string, userKey: any, resource: any): Promise<{}>;
    getSignatureData(userEmail: string, customer: string, maxResults?: number): Promise<{}>;
}
