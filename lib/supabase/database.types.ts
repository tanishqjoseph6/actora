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
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  updated_at: string;
  is_trial: boolean;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_expired: boolean;
};

export type BillingPaymentRow = {
  id: string;
  user_id: string;
  plan_id: string;
  billing_interval: string;
  amount: number;
  currency: string;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  razorpay_subscription_id: string | null;
  status: "paid" | "failed" | "refunded";
  created_at: string;
};

export type TrialEmailLogRow = {
  user_id: string;
  email_type: "day_0" | "day_7" | "day_12" | "day_14";
  sent_at: string;
};

export type WaitlistNotificationRow = {
  id: string;
  email: string;
  user_id: string | null;
  feature: string;
  created_at: string;
};

export type UserNotificationRow = {
  id: string;
  user_id: string;
  category: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  created_at: string;
};
