import { CredentialModel, ImpersonateModel, TokenModel } from "../models/index.model";
export declare class GoogleUtils {
    private _jwtToken;
    private _auth;
    private _calendar;
    private _admin;
    private _drive;
    private _sheets;
    constructor();
    impersonate(parameters: ImpersonateModel): Promise<void>;
    init(credentials: CredentialModel, token: TokenModel): Promise<void>;
    createFolder(folderName: string, parentFolder: string): Promise<{
        folderName: string;
        folderId: string;
    }>;
    countFoldersStartingWith(folderName: string, parentFolder: string): Promise<number>;
    writeSpreadsheetInFolder(fileName: string, data: any, parentFolderId: string, color?: boolean): Promise<any>;
    shareFolderWithContacts(folderId: string, emails: string[], emailMessage: string): Promise<any>;
    updateSpreadsheets(spreadsheetId: string, requestsData: any): void;
    private static getRangeName;
    private static getLastColumnName;
    getCalendarEvents(calendarId: string): Promise<{}>;
    createEvent(calendarId: string, resource: any): Promise<{}>;
    deleteEvent(calendarId: string, eventId: string): Promise<{}>;
    updateSignature(userEmail: string, customer: string, userKey: any, resource: any): Promise<{}>;
    getSignatureData(userEmail: string, customer: string, maxResults?: number): Promise<{}>;
}
