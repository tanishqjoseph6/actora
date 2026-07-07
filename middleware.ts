import { configureNextAuthEnv } from "@/lib/auth/nextauth-url";
import { withAuth } from "next-auth/middleware";

configureNextAuthEnv();

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/billing"],
};
