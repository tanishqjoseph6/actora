import { NextRequest, NextResponse } from "next/server";
import {
  getApiUserEmail,
  unauthenticatedJsonResponse,
} from "@/lib/auth/get-api-user";
import { getAppUrl } from "@/lib/email/config";
import {
  attributeReferralSignup,
  ensureReferralProfile,
  getLeaderboard,
  listReferralsForUser,
} from "@/lib/growth/repository";
import { REFERRAL_REWARDS } from "@/lib/growth/types";
import { sendWelcomeOnboardingEmail } from "@/lib/growth/onboarding-emails";
import { trackEngagement } from "@/lib/growth/engagement";
import { FOUNDER_EMAIL } from "@/lib/contact";

export async function GET(request: NextRequest) {
  const email = await getApiUserEmail(request);
  if (!email) return unauthenticatedJsonResponse();

  try {
    const profile = await ensureReferralProfile(email);
    const referrals = await listReferralsForUser(email);
    const leaderboard = await getLeaderboard(10);
    const appUrl = getAppUrl();
    const link = `${appUrl}/signup?ref=${profile.code}`;

    return NextResponse.json({
      profile,
      link,
      referrals,
      leaderboard,
      rewards: REFERRAL_REWARDS,
      share: {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(
          `Join me on Actora — where conversations become execution. ${link}`
        )}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
        x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          "Where conversations become execution."
        )}&url=${encodeURIComponent(link)}`,
        email: `mailto:${FOUNDER_EMAIL}?subject=${encodeURIComponent(
          "Join me on Actora"
        )}&body=${encodeURIComponent(
          `Hey — I've been using Actora for inbox, CRM, and AI workflows.\n\nJoin with my link: ${link}`
        )}`,
      },
    });
  } catch (error) {
    console.error("[api/referrals GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load referrals." },
      { status: 500 }
    );
  }
}

/** Attribute signup from referral code (called after auth). */
export async function POST(request: NextRequest) {
  const email = await getApiUserEmail(request);
  if (!email) return unauthenticatedJsonResponse();

  try {
    const body = (await request.json().catch(() => ({}))) as {
      code?: string;
      action?: string;
    };

    if (body.action === "welcome") {
      await sendWelcomeOnboardingEmail(email);
      await trackEngagement({ userId: email });
      return NextResponse.json({ ok: true });
    }

    const code = body.code?.trim();
    if (!code) {
      return NextResponse.json({ error: "code is required." }, { status: 400 });
    }

    const referral = await attributeReferralSignup({
      code,
      referredUserId: email,
      referredEmail: email,
    });

    await trackEngagement({ userId: email });

    return NextResponse.json({ ok: true, referral });
  } catch (error) {
    console.error("[api/referrals POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Referral failed." },
      { status: 500 }
    );
  }
}
