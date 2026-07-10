import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import { refreshGoogleAccessToken } from "@/lib/auth/refresh-google-token";
import {
  configureNextAuthEnv,
  getGoogleOAuthCallbackUrl,
  resolveAuthUrl,
  shouldUseSecureCookies,
} from "@/lib/auth/nextauth-url";
import { createSupabaseAnonClient } from "@/lib/supabase/create-anon-client";
import {
  logSupabaseProjectValidation,
  SUPABASE_ENV,
} from "@/lib/supabase/config";
import { getStoredSubscription } from "@/lib/subscription/repository";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

configureNextAuthEnv();

function serializeError(value: unknown): unknown {
  if (!value) return value;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      cause: serializeError((value as Error & { cause?: unknown }).cause),
    };
  }

  if (typeof value !== "object") return value;

  const input = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(input)) {
    out[key] = serializeError(v);
  }
  return out;
}

function requiredAuthEnv(): Record<string, string | undefined> {
  return {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  };
}

function assertRequiredAuthEnv(): void {
  const required = requiredAuthEnv();
  const missing = Object.entries(required)
    .filter(([, value]) => !value || value.trim().length === 0)
    .map(([key]) => key);

  if (missing.length > 0) {
    const message = `[next-auth] Missing required auth env: ${missing.join(", ")}`;
    // In production, fail fast to avoid opaque OAuthCallback loops.
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }
    console.error(message);
  }
}

function extractOAuthRootCause(payload: unknown): string | null {
  const serialized = JSON.stringify(payload ?? {});
  const knownSignals = [
    "invalid_client",
    "redirect_uri_mismatch",
    "invalid_grant",
    "state",
    "PKCE",
    "JWT_SESSION_ERROR",
    "decryption operation failed",
    "JWEDecryptionFailed",
    "OAuthCallbackError",
  ];

  for (const signal of knownSignals) {
    if (serialized.includes(signal)) return signal;
  }
  return null;
}

assertRequiredAuthEnv();
logSupabaseProjectValidation("next-auth");

if (process.env.NODE_ENV === "development") {
  console.log("[next-auth] Auth URL:", resolveAuthUrl());
  console.log("[next-auth] Google OAuth callback:", getGoogleOAuthCallbackUrl());
  console.log("[next-auth] AUTH_TRUST_HOST:", process.env.AUTH_TRUST_HOST ?? "false");
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  useSecureCookies: shouldUseSecureCookies(),

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

        try {
          const supabase = createSupabaseAnonClient({ persistSession: false });
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
        } catch (error) {
          if (error instanceof Error && error.message === "Email not confirmed") {
            throw error;
          }
          console.error(
            `[next-auth] Supabase credentials sign-in failed. Ensure ${SUPABASE_ENV.URL} and ${SUPABASE_ENV.ANON_KEY} are set for the same project.`,
            error
          );
          return null;
        }
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
    maxAge: 30 * 24 * 60 * 60,
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, account, trigger, session, user }) {
      if (account || user) {
        let planId = token.planId ?? "free";
        const email = user?.email ?? token.email;
        if (email) {
          try {
            const stored = await getStoredSubscription(
              normalizeSubscriptionUserId(email)
            );
            planId = stored.planId;
          } catch (error) {
            console.error("[next-auth] Failed to load subscription plan:", error);
          }
        }

        if (account) {
          return {
            ...token,
            accessToken: account.access_token,
            refreshToken: account.refresh_token ?? token.refreshToken,
            accessTokenExpires: account.expires_at
              ? account.expires_at * 1000
              : Date.now() + 3600 * 1000,
            planId,
          };
        }

        return { ...token, planId };
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
      const payload = serializeError(metadata);

      console.error(`[next-auth][error][${code}]`, payload);

      if (
        code === "OAUTH_CALLBACK_ERROR" ||
        code === "OAUTH_CALLBACK_HANDLER_ERROR"
      ) {
        const root = extractOAuthRootCause(payload);
        console.error("[next-auth] OAuth callback failure details:", {
          code,
          inferredRootCause: root,
          authUrl: resolveAuthUrl(),
          expectedCallback: getGoogleOAuthCallbackUrl(),
          googleClientIdLoaded: Boolean(process.env.GOOGLE_CLIENT_ID),
          googleClientSecretLoaded: Boolean(process.env.GOOGLE_CLIENT_SECRET),
          nextAuthSecretLoaded: Boolean(process.env.NEXTAUTH_SECRET),
          nextAuthUrlEnv: process.env.NEXTAUTH_URL ?? null,
          trustHost: process.env.AUTH_TRUST_HOST ?? "false",
          ...(typeof payload === "object" && payload !== null ? payload : { payload }),
        });
      }
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
