import NextAuth from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { configureNextAuthEnv, resolveAuthUrl } from "@/lib/auth/nextauth-url";

configureNextAuthEnv();

const nextAuthHandler = NextAuth(authOptions);

/**
 * On Vercel, NextAuth builds OAuth redirect_uri from x-forwarded-host
 * (detectOrigin), not NEXTAUTH_URL. Force the canonical production host so
 * Google always receives https://useactora.com/api/auth/callback/google.
 */
function withCanonicalProductionHost(req: NextRequest): NextRequest {
  if (process.env.NODE_ENV !== "production") {
    return req;
  }

  const canonicalHost = new URL(resolveAuthUrl()).host;
  const headers = new Headers(req.headers);
  headers.set("host", canonicalHost);
  headers.set("x-forwarded-host", canonicalHost);
  headers.set("x-forwarded-proto", "https");

  return new NextRequest(req, { headers });
}

export async function GET(req: NextRequest) {
  return nextAuthHandler(withCanonicalProductionHost(req));
}

export async function POST(req: NextRequest) {
  return nextAuthHandler(withCanonicalProductionHost(req));
}
