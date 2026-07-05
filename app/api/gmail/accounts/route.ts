import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { gmailAccountRepository } from "@/lib/gmail/repository";
import { toPublicGmailAccount } from "@/lib/gmail/types";

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
