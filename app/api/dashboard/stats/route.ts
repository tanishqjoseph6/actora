import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { getDashboardData } from "@/lib/dashboard/stats";
import { EMPTY_DASHBOARD_DATA } from "@/lib/dashboard/types";

export async function GET() {
  // #region agent log
  fetch("http://127.0.0.1:7591/ingest/ba758f26-6384-42d0-bcfa-81310e1b9c4c",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"5e59d5"},body:JSON.stringify({sessionId:"5e59d5",runId:"initial",hypothesisId:"H2",location:"app/api/dashboard/stats/route.ts:8",message:"dashboard stats route entered",data:{nodeEnv:process.env.NODE_ENV,hasSupabaseUrl:Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),hasSupabaseAnonKey:Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),hasServiceRoleKey:Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),hasNextAuthSecret:Boolean(process.env.NEXTAUTH_SECRET)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  try {
    const session = await getServerSession(authOptions);
    // #region agent log
    fetch("http://127.0.0.1:7591/ingest/ba758f26-6384-42d0-bcfa-81310e1b9c4c",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"5e59d5"},body:JSON.stringify({sessionId:"5e59d5",runId:"initial",hypothesisId:"H1,H2",location:"app/api/dashboard/stats/route.ts:13",message:"dashboard stats session resolved",data:{hasSession:Boolean(session),hasUser:Boolean(session?.user),hasEmail:Boolean(session?.user?.email)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const userId = session?.user?.email;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const data = await getDashboardData(userId);
    // #region agent log
    fetch("http://127.0.0.1:7591/ingest/ba758f26-6384-42d0-bcfa-81310e1b9c4c",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"5e59d5"},body:JSON.stringify({sessionId:"5e59d5",runId:"initial",hypothesisId:"H2",location:"app/api/dashboard/stats/route.ts:20",message:"dashboard stats data returned",data:{emailCount:data.stats.emailCount,connectedGmailAccounts:data.stats.connectedGmailAccounts,crmContacts:data.stats.crmContacts,meetings:data.stats.meetings,automations:data.stats.automations},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return NextResponse.json(data);
  } catch (error) {
    console.error("[dashboard/stats] Falling back to empty dashboard data:", error);
    // #region agent log
    fetch("http://127.0.0.1:7591/ingest/ba758f26-6384-42d0-bcfa-81310e1b9c4c",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"5e59d5"},body:JSON.stringify({sessionId:"5e59d5",runId:"initial",hypothesisId:"H2",location:"app/api/dashboard/stats/route.ts:26",message:"dashboard stats route caught exception",data:{errorName:error instanceof Error?error.name:"unknown",errorMessage:error instanceof Error?error.message:String(error)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return NextResponse.json(EMPTY_DASHBOARD_DATA);
  }
}
