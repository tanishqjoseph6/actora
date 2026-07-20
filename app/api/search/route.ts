import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { runGlobalSearch } from "@/lib/search/global-search";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await runGlobalSearch(userId, query, request);
    return NextResponse.json({ results, query });
  } catch (error) {
    console.error("[search] failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Search failed. Try again.",
        results: [],
      },
      { status: 500 }
    );
  }
}
