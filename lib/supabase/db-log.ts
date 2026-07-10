export type PostgrestErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function formatPostgrestError(
  error: PostgrestErrorLike | null | undefined
): string {
  if (!error) return "unknown error";
  const parts = [
    error.message,
    error.code ? `code=${error.code}` : null,
    error.details ? `details=${error.details}` : null,
    error.hint ? `hint=${error.hint}` : null,
  ].filter(Boolean);
  return parts.join(" | ");
}

export function logDbWriteStart(
  scope: string,
  operation: string,
  table: string,
  payload: Record<string, unknown>
): void {
  console.log(`[${scope}] db:${operation}:start`, { table, ...payload });
}

export function logDbWriteResult(
  scope: string,
  operation: string,
  table: string,
  result: {
    httpStatus?: number;
    statusText?: string;
    error?: PostgrestErrorLike | null;
    rows?: number;
    data?: unknown;
  }
): void {
  const level = result.error ? "error" : "log";
  const payload = {
    table,
    httpStatus: result.httpStatus,
    statusText: result.statusText,
    rows: result.rows,
    error: result.error
      ? {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
          formatted: formatPostgrestError(result.error),
        }
      : null,
    data: result.data,
  };

  if (level === "error") {
    console.error(`[${scope}] db:${operation}:failed`, payload);
  } else {
    console.log(`[${scope}] db:${operation}:ok`, payload);
  }
}

export function throwDbWriteError(
  scope: string,
  operation: string,
  table: string,
  error: PostgrestErrorLike,
  context?: Record<string, unknown>
): never {
  logDbWriteResult(scope, operation, table, { error });
  throw new Error(
    `[${scope}] ${operation} on ${table} failed: ${formatPostgrestError(error)}` +
      (context ? ` ${JSON.stringify(context)}` : "")
  );
}
