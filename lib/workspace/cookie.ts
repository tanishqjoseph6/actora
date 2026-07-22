export const WORKSPACE_COOKIE = "actora_workspace_id";
export const WORKSPACE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function workspaceCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: WORKSPACE_COOKIE_MAX_AGE,
    secure,
  };
}
