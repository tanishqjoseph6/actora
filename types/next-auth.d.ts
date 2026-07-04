import type { DefaultSession } from "next-auth";
import type { PlanId } from "@/lib/subscription";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    planId?: PlanId;
    error?: "RefreshAccessTokenError";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    planId?: PlanId;
    error?: "RefreshAccessTokenError";
  }
}
