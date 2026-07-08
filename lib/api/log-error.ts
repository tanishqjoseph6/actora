export function serializeApiError(error: unknown): Record<string, unknown> {
  if (!error) return { error: null };

  if (error instanceof Error) {
    const out: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    const cause = (error as Error & { cause?: unknown }).cause;
    if (cause !== undefined) {
      out.cause = serializeApiError(cause);
    }

    const gaxios = error as Error & {
      code?: string;
      response?: { status?: number; data?: unknown };
    };

    if (gaxios.code) out.code = gaxios.code;
    if (gaxios.response) {
      out.responseStatus = gaxios.response.status;
      out.responseData = gaxios.response.data;
    }

    return out;
  }

  if (typeof error === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(error as Record<string, unknown>)) {
      out[key] = serializeApiError(value);
    }
    return out;
  }

  return { error: String(error) };
}

export function logApiError(scope: string, error: unknown, context?: Record<string, unknown>) {
  console.error(`[${scope}]`, {
    ...context,
    error: serializeApiError(error),
  });
}
