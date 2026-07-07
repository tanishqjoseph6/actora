/** Row shapes for Supabase tables used by the app (manual; not codegen). */

export type UserUsageRow = {
  user_id: string;
  ai_actions_used: number;
  ai_replies_count: number;
  period_start: string;
  updated_at: string;
};
