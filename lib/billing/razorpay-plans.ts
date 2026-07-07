import type { BillingPeriod, PaidPlanId } from "@/components/billing/pricing-data";

const PLAN_ENV_KEYS: Record<PaidPlanId, Record<BillingPeriod, string>> = {
  pro: {
    monthly: "RAZORPAY_PRO_PLAN_ID",
    yearly: "RAZORPAY_PRO_YEARLY_PLAN_ID",
  },
  starter: {
    monthly: "RAZORPAY_TEAM_PLAN_ID",
    yearly: "RAZORPAY_TEAM_YEARLY_PLAN_ID",
  },
};

const PLAN_LABELS: Record<PaidPlanId, string> = {
  pro: "Pro",
  starter: "Team",
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

function validatePlanId(envKey: string, planId: PaidPlanId, period: BillingPeriod): string {
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
 * Resolves the Razorpay dashboard plan ID for a paid app plan + billing period.
 * Throws a descriptive error if the required environment variable is missing or invalid.
 */
export function getRazorpayPlanId(
  planId: PaidPlanId,
  period: BillingPeriod
): string {
  const envKey = PLAN_ENV_KEYS[planId][period];
  return validatePlanId(envKey, planId, period);
}

export function getRazorpayPlanEnvKey(
  planId: PaidPlanId,
  period: BillingPeriod
): string {
  return PLAN_ENV_KEYS[planId][period];
}

/** Logs configured plan IDs (for debugging). Safe to print — not secrets. */
export function getConfiguredRazorpayPlanIds(): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [planId, periods] of Object.entries(PLAN_ENV_KEYS) as [
    PaidPlanId,
    Record<BillingPeriod, string>,
  ][]) {
    for (const [period, envKey] of Object.entries(periods) as [
      BillingPeriod,
      string,
    ][]) {
      out[`${planId}.${period}`] = readPlanEnv(envKey);
    }
  }
  return out;
}
