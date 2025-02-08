export interface RefreshTokenResponse {
    access_token: string;
    id_token?: string;
    refresh_token?: string;
    expires_in: number;
    refresh_expires_in?: number;
    realm_access?: {
        roles: string[]
    } | null;
    resource_access?: {
        [key: string]: {
            roles: string[]
        }
    } | null;
} 