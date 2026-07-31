/**
 * Verify Roxx create_task tool path via task repository logic.
 * Run: node --env-file=.env.local scripts/test-roxx-create-task.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const testUserId = process.env.ROXX_TEST_USER?.trim() || "roxx-task-test@example.com";

async function main() {
  const title = "Create a reminder for tomorrow";
  const due = new Date(Date.now() + 1 * 24 * 60 * 60_000).toISOString();

  const { data, error } = await db
    .from("tasks")
    .insert({
      user_id: testUserId,
      title,
      description: "Roxx reminder test",
      priority: "medium",
      status: "todo",
      due_date: due,
      tags: ["assistant"],
    })
    .select("id, title")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "create failed");
  }

  console.log("[test-roxx-create-task] ok", data);

  await db.from("tasks").delete().eq("id", data.id);
  console.log("[test-roxx-create-task] cleaned up");
}

main().catch((err) => {
  console.error("[test-roxx-create-task] FAILED", err);
  process.exit(1);
});
