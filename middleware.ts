import { configureNextAuthEnv } from "@/lib/auth/nextauth-url";
import { resolveSafeCallbackUrl } from "@/lib/auth/safe-redirect";
import { hasProductAccess } from "@/lib/trial/helpers";
import type { PlanId } from "@/lib/subscription";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

configureNextAuthEnv();

/** Public routes that logged-in users should leave immediately. */
const AUTH_ENTRY_PATHS = new Set(["/", "/login", "/signup"]);

/** Routes that remain reachable after trial expiry (upgrade path). */
const BILLING_PATHS = new Set(["/billing"]);

function tokenHasAccess(token: {
  planId?: PlanId | string;
  isTrial?: boolean;
  trialEndsAt?: string | null;
  trialExpired?: boolean;
}): boolean {
  const planId = (token.planId as PlanId) ?? "free";
  return hasProductAccess({
    planId,
    status: "active",
    trial: {
      isTrial: Boolean(token.isTrial),
      trialStartedAt: null,
      trialEndsAt: token.trialEndsAt ?? null,
      trialExpired: Boolean(token.trialExpired),
    },
  });
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (token && AUTH_ENTRY_PATHS.has(pathname)) {
      const callbackUrl = resolveSafeCallbackUrl(
        req.nextUrl.searchParams.get("callbackUrl")
      );
      return NextResponse.redirect(new URL(callbackUrl, req.url));
    }

    // Expired trial / no access → force upgrade page (except billing itself).
    if (
      token &&
      pathname.startsWith("/dashboard") &&
      !tokenHasAccess(token)
    ) {
      const billingUrl = new URL("/billing", req.url);
      billingUrl.searchParams.set("trial", "expired");
      return NextResponse.redirect(billingUrl);
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        if (AUTH_ENTRY_PATHS.has(pathname)) {
          return true;
        }

        if (BILLING_PATHS.has(pathname)) {
          return Boolean(token);
        }

        return Boolean(token);
      },
    },
  }
);

export const config = {
  matcher: ["/", "/login", "/signup", "/dashboard", "/dashboard/:path*", "/billing"],
};
