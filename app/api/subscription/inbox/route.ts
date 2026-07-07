import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import {
  canConnectInbox,
  subscriptionProvider,
  toSubscriptionSnapshot,
} from "@/lib/subscription";

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
}

export async function GET() {
  const userId = await getUserId();

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const subscription = await subscriptionProvider.getSubscription(userId);
  const gate = canConnectInbox(subscription.planId, subscription.usage);

  return NextResponse.json({
    allowed: gate.allowed,
    reason: gate.allowed ? null : gate.reason,
    limitType: gate.allowed ? null : gate.limitType,
    subscription: toSubscriptionSnapshot(subscription),
  });
}

export async function POST() {
  const userId = await getUserId();

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const subscription = await subscriptionProvider.getSubscription(userId);
  const gate = canConnectInbox(subscription.planId, subscription.usage);

  if (!gate.allowed) {
    return NextResponse.json(
      {
        error: gate.reason,
        code: "PLAN_LIMIT",
        limitType: gate.limitType,
      },
      { status: 403 }
    );
  }

  const updated = await subscriptionProvider.recordInboxConnection(userId);

  return NextResponse.json({
    subscription: toSubscriptionSnapshot(updated),
  });
}
