import { AuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import NextAuth from "next-auth/next";
import KeycloakProvider from "next-auth/providers/keycloak";

const authOptions: AuthOptions = {
  debug: true, // Enable debug logs
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
      authorization: {
        params: {
          scope: "openid email profile",
          response_type: "code",
          grant_type: "authorization_code"
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.idToken = account.id_token
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        const keycloakProfile = profile as {
          realm_access?: { roles: string[] };
          resource_access?: { [key: string]: { roles: string[] } };
        };
        token.roles = [
          ...(keycloakProfile.realm_access?.roles ?? []),
          ...(keycloakProfile.resource_access?.['nextjs']?.roles ?? [])
        ]
        return token
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      session.roles = token.roles;
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('Sign in success', { user, account, profile, isNewUser })
    },
    async signOut({ session, token }) {
      console.log('Sign out success', { session, token })
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST, authOptions };
