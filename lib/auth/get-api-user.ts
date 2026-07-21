import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { shouldUseSecureCookies } from "@/lib/auth/nextauth-url";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

type JwtLike = {
  email?: string | null;
};

function emailFromJwt(token: JwtLike | null): string | null {
  const email = token?.email;
  if (typeof email === "string" && email.includes("@")) {
    return normalizeSubscriptionUserId(email);
  }
  return null;
}

async function buildReqLike(request?: NextRequest) {
  if (request) {
    return request;
  }

  const headerStore = await headers();
  const cookieStore = await cookies();

  return {
    headers: Object.fromEntries(headerStore.entries()),
    cookies: Object.fromEntries(
      cookieStore.getAll().map((cookie) => [cookie.name, cookie.value])
    ),
  } as unknown as NextRequest;
}

/**
 * Resolve the signed-in user's email inside App Router route handlers.
 * Uses the same secure-cookie setting as NextAuth (`useSecureCookies`).
 */
export async function getApiUserEmail(
  request?: NextRequest
): Promise<string | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error("[auth/getApiUserEmail] NEXTAUTH_SECRET is not configured.");
    return null;
  }

  try {
    const token = await getToken({
      req: await buildReqLike(request),
      secret,
      secureCookie: shouldUseSecureCookies(),
    });
    const fromJwt = emailFromJwt(token);
    if (fromJwt) return fromJwt;
  } catch (error) {
    console.error("[auth/getApiUserEmail] JWT decode failed:", error);
  }

  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (email) return normalizeSubscriptionUserId(email);
  } catch (error) {
    console.error("[auth/getApiUserEmail] getServerSession failed:", error);
  }

  return null;
}

export function unauthenticatedJsonResponse(message = "Not authenticated.") {
  return Response.json(
    {
      error: message,
      code: "UNAUTHENTICATED",
      loginUrl: "/login",
    },
    { status: 401 }
  );
}
