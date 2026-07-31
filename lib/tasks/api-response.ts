import { NextResponse } from "next/server";
import type { TaskServiceError } from "./errors";

export function tasksJsonError(error: TaskServiceError): NextResponse {
  const body: Record<string, unknown> = {
    error: error.message,
    code: error.code,
  };
  if (process.env.NODE_ENV !== "production" && error.details) {
    body.details = error.details;
  }
  return NextResponse.json(body, { status: error.status });
}

export function formatTaskToolError(error: TaskServiceError): {
  ok: false;
  error: string;
  code: TaskServiceError["code"];
} {
  return {
    ok: false,
    error: error.message,
    code: error.code,
  };
}
