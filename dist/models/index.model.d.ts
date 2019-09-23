export interface CredentialModel {
    client_id: string;
    client_secret: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    redirect_uris: string[];
}
export interface TokenModel {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expiry_date: number;
}
export interface ImpersonateModel {
    key: string;
    email: string;
    scopes: string[];
    subject: string;
}
