import { authOptions } from "@/lib/auth/auth-options";
import { getAiCreditSnapshot } from "@/lib/ai-credits/snapshot";
import {
  acknowledgeUsageEvents,
  listUnacknowledgedUsageEvents,
} from "@/lib/ai-credits/usage-notifications";
import type { AiCreditUsageMilestone } from "@/lib/ai-credits/milestones";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(email);
  const [snapshot, pendingEvents] = await Promise.all([
    getAiCreditSnapshot(userId),
    listUnacknowledgedUsageEvents(userId),
  ]);

  return NextResponse.json({ snapshot, pendingEvents });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(email);
  const body = (await request.json().catch(() => ({}))) as {
    milestones?: number[];
  };

  const milestones = (body.milestones ?? []).filter(
    (m): m is AiCreditUsageMilestone =>
      m === 25 || m === 50 || m === 75 || m === 90 || m === 100
  );

  await acknowledgeUsageEvents(userId, milestones);
  return NextResponse.json({ ok: true });
}
