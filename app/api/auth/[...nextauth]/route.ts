import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
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
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          console.error("[next-auth] Supabase env vars missing for credentials sign-in");
          return null;
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message === "Email not confirmed") {
            throw new Error("Email not confirmed");
          }
          return null;
        }

        if (!data.user) {
          return null;
        }

        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          throw new Error("Email not confirmed");
        }

        return {
          id: data.user.id,
          email: data.user.email ?? email,
          name:
            (data.user.user_metadata?.full_name as string | undefined) ??
            data.user.email?.split("@")[0] ??
            "User",
        };
      },
    }),
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
