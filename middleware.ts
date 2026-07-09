import { configureNextAuthEnv } from "@/lib/auth/nextauth-url";
import { resolveSafeCallbackUrl } from "@/lib/auth/safe-redirect";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

configureNextAuthEnv();

/** Public routes that logged-in users should leave immediately. */
const AUTH_ENTRY_PATHS = new Set(["/", "/login", "/signup"]);

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    if (req.nextauth.token && AUTH_ENTRY_PATHS.has(pathname)) {
      const callbackUrl = resolveSafeCallbackUrl(
        req.nextUrl.searchParams.get("callbackUrl")
      );
      return NextResponse.redirect(new URL(callbackUrl, req.url));
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

        return Boolean(token);
      },
    },
  }
);

export const config = {
  matcher: ["/", "/login", "/signup", "/dashboard", "/dashboard/:path*", "/billing"],
};
