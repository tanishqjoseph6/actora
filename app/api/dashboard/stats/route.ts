import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { getDashboardData } from "@/lib/dashboard/stats";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const data = await getDashboardData(userId);
  return NextResponse.json(data);
}
