/** Row shapes for Supabase tables used by the app (manual; not codegen). */

export type UserUsageRow = {
  user_id: string;
  ai_actions_used: number;
  ai_replies_count: number;
  period_start: string;
  updated_at: string;
};

export type UserSubscriptionRow = {
  user_id: string;
  plan_id: string;
  status: string;
  billing_interval: string;
  current_period_end: string;
  razorpay_subscription_id: string | null;
  razorpay_plan_id: string | null;
  updated_at: string;
};
