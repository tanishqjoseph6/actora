/** Google OAuth scope constants — shared by sign-in and product connect flows. */

/** Identity-only scopes for login / sign-up (no Gmail, Calendar, or other Google APIs). */
export const GOOGLE_IDENTITY_SCOPES = [
  "openid",
  "email",
  "profile",
] as const;

export const GOOGLE_IDENTITY_SCOPE = GOOGLE_IDENTITY_SCOPES.join(" ");

/** Gmail API scopes — requested only when the user clicks Connect Gmail. */
export const GOOGLE_GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
] as const;

export const GOOGLE_GMAIL_CONNECT_SCOPE = [
  ...GOOGLE_IDENTITY_SCOPES,
  ...GOOGLE_GMAIL_SCOPES,
].join(" ");

/** Google Calendar API scopes — requested only when the user clicks Connect Calendar. */
export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
] as const;

export const GOOGLE_CALENDAR_CONNECT_SCOPE = [
  ...GOOGLE_IDENTITY_SCOPES,
  ...GOOGLE_CALENDAR_SCOPES,
].join(" ");

/** Params for incremental OAuth when connecting Gmail or Calendar after sign-in. */
export const GOOGLE_PRODUCT_OAUTH_PARAMS = {
  include_granted_scopes: "true",
  prompt: "consent",
  access_type: "offline",
} as const;

export const CALENDAR_OAUTH_CALLBACK_PARAM = "calendar_connected";
export const CALENDAR_OAUTH_CALLBACK_URL = `/dashboard/settings?${CALENDAR_OAUTH_CALLBACK_PARAM}=1#integrations`;
