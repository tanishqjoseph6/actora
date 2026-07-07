export type GmailErrorCode =
  | "GMAIL_NOT_CONNECTED"
  | "OAUTH_EXPIRED"
  | "OAUTH_DENIED"
  | "PLAN_LIMIT"
  | "GMAIL_API_ERROR"
  | "UNKNOWN";

export type MappedGmailError = {
  message: string;
  code: GmailErrorCode;
  status: number;
};

const ERROR_PATTERNS: Array<{
  match: (message: string) => boolean;
  result: Omit<MappedGmailError, "status"> & { status?: number };
}> = [
  {
    match: (m) => m.includes("invalid_grant") || m.includes("Token has been expired or revoked"),
    result: {
      message:
        "Google access expired or was revoked. Reconnect your Gmail account to continue.",
      code: "OAUTH_EXPIRED",
      status: 403,
    },
  },
  {
    match: (m) => m.includes("insufficient") && m.includes("permission"),
    result: {
      message:
        "Gmail permissions were not granted. Reconnect and approve all requested permissions.",
      code: "OAUTH_DENIED",
      status: 403,
    },
  },
  {
    match: (m) => m.includes("Gmail access not granted"),
    result: {
      message:
        "Sign in with Google and authorize Gmail access to connect your inbox.",
      code: "OAUTH_DENIED",
      status: 403,
    },
  },
  {
    match: (m) => m.includes("Gmail is not connected"),
    result: {
      message: "Connect a Gmail account from your dashboard to sync email.",
      code: "GMAIL_NOT_CONNECTED",
      status: 403,
    },
  },
];

export function mapGmailOAuthError(error: unknown): MappedGmailError {
  const message =
    error instanceof Error ? error.message : "An unexpected Gmail error occurred.";

  for (const pattern of ERROR_PATTERNS) {
    if (pattern.match(message)) {
      return {
        message: pattern.result.message,
        code: pattern.result.code,
        status: pattern.result.status ?? 500,
      };
    }
  }

  return {
    message,
    code: "GMAIL_API_ERROR",
    status: 500,
  };
}

export function gmailErrorResponse(error: unknown) {
  const mapped = mapGmailOAuthError(error);
  return { error: mapped.message, code: mapped.code, status: mapped.status };
}
