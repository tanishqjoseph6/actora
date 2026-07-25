import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { configureNextAuthEnv } from "@/lib/auth/nextauth-url";

configureNextAuthEnv();

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
