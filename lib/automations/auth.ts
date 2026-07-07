import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export async function getAutomationUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
}
