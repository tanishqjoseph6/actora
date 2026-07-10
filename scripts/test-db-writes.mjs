/**
 * Smoke-test Supabase writes for gmail_accounts and user_subscriptions.
 * Run: node --env-file=.env.local scripts/test-db-writes.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const testUserId = `test-${Date.now()}@example.com`;
const testEmail = `gmail-test-${Date.now()}@example.com`;

function log(step, payload) {
  console.log(`[test-db-writes] ${step}`, payload);
}

async function testGmailInsert() {
  log("gmail:insert:start", { user_id: testUserId, email: testEmail });

  const { data, error, status, statusText } = await db
    .from("gmail_accounts")
    .insert({
      user_id: testUserId,
      email: testEmail,
      access_token: "test-token",
      refresh_token: "test-refresh",
    })
    .select("*");

  log("gmail:insert:result", {
    httpStatus: status,
    statusText,
    error,
    rows: data?.length ?? 0,
    data,
  });

  if (error) throw new Error(`gmail insert failed: ${error.message}`);

  const { data: readBack, error: readError } = await db
    .from("gmail_accounts")
    .select("*")
    .eq("user_id", testUserId)
    .eq("email", testEmail)
    .maybeSingle();

  log("gmail:verify", { readBack, readError });
  if (readError || !readBack) {
    throw new Error("gmail verify read-back failed");
  }

  const { error: dupError } = await db.from("gmail_accounts").insert({
    user_id: testUserId,
    email: testEmail,
    access_token: "dup-token",
  });

  log("gmail:duplicate", {
    blocked: Boolean(dupError),
    code: dupError?.code,
    message: dupError?.message,
  });

  await db
    .from("gmail_accounts")
    .delete()
    .eq("user_id", testUserId)
    .eq("email", testEmail);

  log("gmail:cleanup", { ok: true });
}

async function testSubscriptionUpsert() {
  log("subscription:upsert:start", { user_id: testUserId, plan_id: "pro" });

  const payload = {
    user_id: testUserId,
    plan_id: "pro",
    status: "active",
    billing_interval: "monthly",
    current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    razorpay_subscription_id: `sub_test_${Date.now()}`,
    razorpay_plan_id: "plan_test",
  };

  const { data, error, status, statusText } = await db
    .from("user_subscriptions")
    .upsert(payload, { onConflict: "user_id" })
    .select("*");

  log("subscription:upsert:result", {
    httpStatus: status,
    statusText,
    error,
    rows: data?.length ?? 0,
    data,
  });

  if (error) throw new Error(`subscription upsert failed: ${error.message}`);

  const { data: verify, error: verifyError } = await db
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", testUserId)
    .maybeSingle();

  log("subscription:verify", { verify, verifyError });

  if (verifyError || !verify || verify.plan_id !== "pro") {
    throw new Error("subscription verify failed");
  }

  await db.from("user_subscriptions").delete().eq("user_id", testUserId);
  log("subscription:cleanup", { ok: true });
}

try {
  await testGmailInsert();
  await testSubscriptionUpsert();
  console.log("[test-db-writes] ALL PASSED");
} catch (error) {
  console.error("[test-db-writes] FAILED", error);
  process.exit(1);
}
