import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { gmailAccountRepository } from "@/lib/gmail/repository";
import { revokeOAuthToken } from "@/lib/gmail/oauth";
import { toPublicGmailAccount } from "@/lib/gmail/types";
import { subscriptionProvider, toSubscriptionSnapshot } from "@/lib/subscription";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const accounts = await gmailAccountRepository.listAccounts(userId);

  return NextResponse.json({
    accounts: accounts.map(toPublicGmailAccount),
    connected: accounts.length > 0,
  });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let email: string | null = request.nextUrl.searchParams.get("email");

  if (!email) {
    try {
      const body = (await request.json()) as { email?: string };
      email = body.email ?? null;
    } catch {
      email = null;
    }
  }

  if (!email) {
    return NextResponse.json(
      { error: "Gmail account email is required." },
      { status: 400 }
    );
  }

  const account = await gmailAccountRepository.getAccount(userId, email);

  if (!account) {
    return NextResponse.json(
      { error: "Gmail account not found." },
      { status: 404 }
    );
  }

  try {
    await revokeOAuthToken(account.accessToken);
  } catch {
    // Continue with local disconnect.
  }

  const removed = await gmailAccountRepository.deleteAccount(userId, email);

  if (!removed) {
    return NextResponse.json(
      { error: "Could not disconnect Gmail account." },
      { status: 500 }
    );
  }

  const accounts = await gmailAccountRepository.listAccounts(userId);
  const subscription = await subscriptionProvider.getSubscription(userId);

  return NextResponse.json({
    disconnected: email,
    accounts: accounts.map(toPublicGmailAccount),
    connected: accounts.length > 0,
    subscription: toSubscriptionSnapshot(subscription),
  });
}
