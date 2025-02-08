import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt"

declare module "next-auth/jwt" {
  interface JWT {
    idToken?: string
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    error?: string
    roles?: string[]
  }
}

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
    roles?: string[];
  }

  interface Profile {
    realm_access?: {
      roles: string[]
    }
    resource_access?: {
      [key: string]: {
        roles: string[]
      }
    }
  }
}

declare module "next-auth/providers/oauth" {
  interface TokenSet {
    id_token?: string;
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    refresh_expires_in: number;
    realm_access?: {
      roles: string[]
    }
    resource_access?: {
      [key: string]: {
        roles: string[]
      }
    }
  }
}

// Add this interface for the refresh token response
interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  refresh_expires_in?: number;
  realm_access?: {
    roles: string[]
  }
  resource_access?: {
    [key: string]: {
      roles: string[]
    }
  }
}