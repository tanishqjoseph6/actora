import type { DefaultSession } from "next-auth";
import type { PlanId } from "@/lib/subscription";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    planId?: PlanId;
    isTrial?: boolean;
    trialEndsAt?: string | null;
    trialExpired?: boolean;
    error?: string;
    user: DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    planId?: PlanId;
    isTrial?: boolean;
    trialEndsAt?: string | null;
    trialExpired?: boolean;
    error?: string;
  }
}
