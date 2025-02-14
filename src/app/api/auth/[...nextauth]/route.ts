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
    async jwt({ token, account }) {
      if (account) {
        // Decode the access token to get the roles
        const accessToken = account.access_token!;
        const decodedToken = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          roles: decodedToken.realm_access?.roles || []
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken,
        idToken: token.idToken,
        roles: token.roles
      };
    }
  },
  events: {
    async signOut({ token }) {
      try {
        const logoutUrl = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout`;
        const params = new URLSearchParams({
          client_id: process.env.KEYCLOAK_CLIENT_ID!,
          post_logout_redirect_uri: process.env.NEXTAUTH_URL,
          access_token_hint: token.accessToken as string
        });

        await fetch(`${logoutUrl}?${params.toString()}`, {
          method: 'GET'
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
