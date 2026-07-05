import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import { refreshGoogleAccessToken } from "@/lib/auth/refresh-google-token";

const requiredEnv = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`[next-auth] Missing required environment variable: ${key}`);
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  // Prevent __Secure- cookies on local HTTP; production (Vercel) stays HTTPS.
  useSecureCookies: process.env.NODE_ENV === "production",

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send",
          prompt: "consent",
          access_type: "offline",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, account, trigger, session }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000,
          planId: token.planId ?? "free",
        };
      }

      if (trigger === "update" && session?.planId) {
        token.planId = session.planId;
      }

      if (!token.planId) {
        token.planId = "free";
      }

      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      if (token.refreshToken) {
        return refreshGoogleAccessToken(token as JWT);
      }

      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.planId = token.planId ?? "free";

      if (token.error === "RefreshAccessTokenError") {
        session.error = "RefreshAccessTokenError";
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return `${baseUrl}/dashboard`;
    },
  },

  logger: {
    error(code, metadata) {
      console.error(
        `[next-auth][error][${code}]`,
        metadata instanceof Error
          ? { message: metadata.message, stack: metadata.stack }
          : metadata
      );
    },
    warn(code) {
      console.warn(`[next-auth][warn][${code}]`);
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      console.log("[next-auth][event][signIn]", {
        email: user.email,
        provider: account?.provider,
        isNewUser,
      });
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
