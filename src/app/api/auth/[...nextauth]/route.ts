import { AuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import NextAuth from "next-auth/next";
import KeycloakProvider from "next-auth/providers/keycloak";

export const authOptions: AuthOptions = {
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
      // Initial sign in
      if (account && profile) {
        // Decode the access token to get the roles
        const accessToken = account.access_token;
        const decodedToken = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          roles: decodedToken.realm_access?.roles || []
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken,
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
