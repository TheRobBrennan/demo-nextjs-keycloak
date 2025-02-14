import { AuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import NextAuth from "next-auth/next";
import KeycloakProvider from "next-auth/providers/keycloak";

const authOptions: AuthOptions = {
  debug: true, // Enable debug logs
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      authorization: { params: { scope: "openid email profile" } }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        return {
          ...token,
          idToken: account.id_token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          roles: [
            ...(profile.realm_access?.roles || []),
            ...(profile.resource_access?.['nextjs']?.roles || [])
          ]
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken,
        error: token.error,
        roles: token.roles
      };
    }
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
export { handler as GET, handler as POST };
