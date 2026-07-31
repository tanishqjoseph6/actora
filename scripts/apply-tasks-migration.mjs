/**
 * Apply tasks schema repair migration to Supabase Postgres.
 *
 * Usage (pick one):
 *   SUPABASE_DB_URL='postgresql://postgres.[ref]:[password]@...' node --env-file=.env.local scripts/apply-tasks-migration.mjs
 *   supabase login && supabase db query --linked --file supabase/migrations/025_tasks_schema_repair.sql
 *
 * Get SUPABASE_DB_URL from Supabase Dashboard → Project Settings → Database → Connection string (URI).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(
  __dirname,
  "../supabase/migrations/025_tasks_schema_repair.sql"
);

const dbUrl = process.env.SUPABASE_DB_URL?.trim();

function log(step, payload) {
  console.log(`[apply-tasks-migration] ${step}`, payload ?? "");
}

async function applyWithPg() {
  if (!dbUrl) {
    throw new Error("SUPABASE_DB_URL is not set.");
  }

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  const sql = readFileSync(migrationPath, "utf8");
  log("connecting", { hasUrl: true });
  await client.connect();
  try {
    log("executing", migrationPath);
    await client.query(sql);
    log("done", "Migration applied successfully.");
  } finally {
    await client.end();
  }
}

try {
  await applyWithPg();
  process.exit(0);
} catch (error) {
  console.error("[apply-tasks-migration] FAILED", error);
  console.error(`
Could not apply migration automatically.

Option A — set a direct Postgres URL and re-run:
  SUPABASE_DB_URL='postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres' \\
    node --env-file=.env.local scripts/apply-tasks-migration.mjs

Option B — Supabase CLI (after \`supabase login\`):
  supabase link --project-ref ourksliabkrpcmgmwdya
  supabase db query --linked --file supabase/migrations/025_tasks_schema_repair.sql

Option C — Supabase Dashboard → SQL Editor:
  Paste contents of supabase/migrations/025_tasks_schema_repair.sql and run.
`);
  process.exit(1);
}
