import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { getDashboardData } from "@/lib/dashboard/stats";
import { EMPTY_DASHBOARD_DATA } from "@/lib/dashboard/types";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const data = await getDashboardData(userId);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[dashboard/stats] Falling back to empty dashboard data:", error);
    return NextResponse.json(EMPTY_DASHBOARD_DATA);
  }
}
