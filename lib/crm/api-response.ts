import { NextResponse } from "next/server";
import { logApiError } from "@/lib/api/log-error";
import { isMissingCrmSchemaError } from "@/lib/supabase/server";

type CrmRouteContext = Record<string, unknown>;

export function crmErrorResponse(
  scope: string,
  error: unknown,
  context?: CrmRouteContext
): NextResponse {
  logApiError(scope, error, context);

  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    if (isMissingCrmSchemaError(message)) {
      return NextResponse.json(
        {
          error:
            "CRM database schema is not fully migrated. Run Supabase migration 015_crm_full.sql (or 017_crm_schema_repair.sql).",
          details: message,
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const message =
    error instanceof Error ? error.message : "Unexpected CRM server error.";
  return NextResponse.json({ error: message }, { status: 500 });
}

export function crmSupabaseErrorResponse(
  scope: string,
  error: { message: string },
  context?: CrmRouteContext
): NextResponse {
  logApiError(scope, error, context);

  if (isMissingCrmSchemaError(error.message)) {
    return NextResponse.json(
      {
        error:
          "CRM database schema is not fully migrated. Run Supabase migration 015_crm_full.sql (or 017_crm_schema_repair.sql).",
        details: error.message,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: error.message }, { status: 500 });
}

export async function runCrmRoute<T>(
  scope: string,
  handler: () => Promise<T>,
  context?: CrmRouteContext
): Promise<T | NextResponse> {
  try {
    return await handler();
  } catch (error) {
    return crmErrorResponse(scope, error, context);
  }
}
