import type { BillingPeriod, PaidPlanId } from "@/components/billing/pricing-data";

const PLAN_LABELS: Record<PaidPlanId, string> = {
  pro: "Pro",
  starter: "Team",
};

const PLAN_ENV_KEYS: Record<PaidPlanId, string> = {
  pro: "RAZORPAY_PRO_PLAN_ID",
  starter: "RAZORPAY_TEAM_PLAN_ID",
};

export type RazorpayKeyMode = "LIVE" | "TEST" | "UNKNOWN";

export function getRazorpayKeyMode(): RazorpayKeyMode {
  const keyId = process.env.RAZORPAY_KEY_ID ?? "";
  if (keyId.startsWith("rzp_live_")) return "LIVE";
  if (keyId.startsWith("rzp_test_")) return "TEST";
  return "UNKNOWN";
}

export function getRazorpayKeyIdPrefix(): string {
  return (process.env.RAZORPAY_KEY_ID ?? "").slice(0, 8);
}

function readPlanEnv(envKey: string): string | undefined {
  const value = process.env[envKey]?.trim();
  return value || undefined;
}

function validatePlanId(
  envKey: string,
  planId: PaidPlanId,
  period: BillingPeriod
): string {
  const value = readPlanEnv(envKey);

  if (!value) {
    const mode = getRazorpayKeyMode();
    throw new Error(
      `Missing Razorpay plan configuration: ${envKey} is not set. ` +
        `Add the ${PLAN_LABELS[planId]} (${period}) plan ID from your Razorpay ${mode} dashboard.`
    );
  }

  if (!value.startsWith("plan_")) {
    throw new Error(
      `Invalid ${envKey}: "${value}" is not a valid Razorpay plan ID (expected a value starting with "plan_").`
    );
  }

  return value;
}

/**
 * Resolves a static Razorpay dashboard plan ID (legacy / USD plans).
 * For INR checkout, use createDynamicRazorpayPlan instead.
 */
export function getRazorpayPlanId(
  planId: PaidPlanId,
  period: BillingPeriod
): string {
  const envKey = PLAN_ENV_KEYS[planId];
  return validatePlanId(envKey, planId, period);
}

export function getRazorpayPlanEnvKey(
  planId: PaidPlanId,
  period: BillingPeriod
): string {
  return PLAN_ENV_KEYS[planId];
}

/** Logs configured plan IDs (for debugging). Safe to print — not secrets. */
export function getConfiguredRazorpayPlanIds(): Record<
  string,
  string | undefined
> {
  const out: Record<string, string | undefined> = {};
  for (const [planId, envKey] of Object.entries(PLAN_ENV_KEYS) as [
    PaidPlanId,
    string,
  ][]) {
    out[`${planId}.monthly`] = readPlanEnv(envKey);
  }
  return out;
}

export function getPlanLabel(planId: PaidPlanId): string {
  return PLAN_LABELS[planId];
}

/** Map a Razorpay dashboard plan_id back to the app plan + billing period. */
export function resolveAppPlanFromRazorpayPlanId(
  razorpayPlanId: string
): { planId: PaidPlanId; period: BillingPeriod } | null {
  const trimmed = razorpayPlanId.trim();
  if (!trimmed) return null;

  for (const planId of ["pro", "starter"] as PaidPlanId[]) {
    const configured = readPlanEnv(PLAN_ENV_KEYS[planId]);
    if (configured && configured === trimmed) {
      return { planId, period: "monthly" };
    }
  }

  return null;
}
