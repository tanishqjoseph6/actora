/**
 * Verify tasks CRUD against Supabase (service role).
 * Run: node --env-file=.env.local scripts/test-tasks-crud.mjs
 *
 * Requires public.tasks to exist (run apply-tasks-migration first).
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

const testUserId = `tasks-crud-test-${Date.now()}@example.com`;

function log(step, payload) {
  console.log(`[test-tasks-crud] ${step}`, payload ?? "");
}

async function main() {
  log("create:start", { userId: testUserId });
  const due = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
  const { data: created, error: createError } = await db
    .from("tasks")
    .insert({
      user_id: testUserId,
      title: "Roxx CRUD verification task",
      description: "Automated test",
      priority: "medium",
      status: "todo",
      due_date: due,
      tags: ["test"],
    })
    .select("id, title, status")
    .single();

  if (createError || !created) {
    throw new Error(`CREATE failed: ${createError?.message ?? "no row"}`);
  }
  log("create:ok", created);

  const { data: readBack, error: readError } = await db
    .from("tasks")
    .select("id, title, status")
    .eq("id", created.id)
    .eq("user_id", testUserId)
    .maybeSingle();

  if (readError || !readBack) {
    throw new Error(`READ failed: ${readError?.message ?? "not found"}`);
  }
  log("read:ok", readBack);

  const { data: updated, error: updateError } = await db
    .from("tasks")
    .update({ status: "in_progress", title: "Roxx CRUD updated" })
    .eq("id", created.id)
    .eq("user_id", testUserId)
    .select("id, title, status")
    .single();

  if (updateError || updated?.status !== "in_progress") {
    throw new Error(`UPDATE failed: ${updateError?.message ?? "wrong status"}`);
  }
  log("update:ok", updated);

  const { error: deleteError } = await db
    .from("tasks")
    .delete()
    .eq("id", created.id)
    .eq("user_id", testUserId);

  if (deleteError) {
    throw new Error(`DELETE failed: ${deleteError.message}`);
  }
  log("delete:ok", { id: created.id });

  const { data: gone } = await db
    .from("tasks")
    .select("id")
    .eq("id", created.id)
    .maybeSingle();

  if (gone) {
    throw new Error("DELETE verify failed: row still exists");
  }

  log("ALL_PASSED", { taskId: created.id });
}

try {
  await main();
} catch (error) {
  console.error("[test-tasks-crud] FAILED", error);
  process.exit(1);
}
