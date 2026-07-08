export type FetchJsonError = {
  message: string;
  code?: string;
  status?: number;
  details?: string;
};

function logClientFetchError(path: string, error: unknown) {
  const payload =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { error };

  console.error(`[client-fetch] ${path} failed:`, payload);
}

function networkErrorMessage(path: string): string {
  return `Could not reach ${path}. Check your connection and try again.`;
}

/**
 * Same-origin JSON fetch with structured errors (never surfaces raw "TypeError: fetch failed").
 */
export async function fetchJson<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: true; data: T; status: number } | { ok: false; error: FetchJsonError }> {
  const url = path.startsWith("/") ? path : `/${path}`;

  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });

    let data: T & { error?: string; code?: string; message?: string };

    try {
      data = (await res.json()) as T & {
        error?: string;
        code?: string;
        message?: string;
      };
    } catch {
      logClientFetchError(url, new Error(`Non-JSON response (${res.status})`));
      return {
        ok: false,
        error: {
          message: networkErrorMessage(url),
          status: res.status,
          details: `Server returned ${res.status} without JSON body`,
        },
      };
    }

    if (!res.ok) {
      const message =
        data.error ??
        data.message ??
        `Request failed (${res.status})`;

      console.error(`[client-fetch] ${url} ${res.status}:`, data);

      return {
        ok: false,
        error: {
          message,
          code: data.code,
          status: res.status,
        },
      };
    }

    return { ok: true, data: data as T, status: res.status };
  } catch (error) {
    logClientFetchError(url, error);

    const details =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error);

    return {
      ok: false,
      error: {
        message: networkErrorMessage(url),
        details,
      },
    };
  }
}
