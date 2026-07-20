/** Google Calendar OAuth scopes (kept separate from Gmail defaults). */

export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
] as const;

/** Base identity scopes shared with Gmail connect. */
export const GOOGLE_IDENTITY_SCOPES = [
  "openid",
  "email",
  "profile",
] as const;

/** Existing Gmail scopes — always re-requested with calendar so Gmail stays intact. */
export const GOOGLE_GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
] as const;

/** Full scope string for incremental Calendar connect (includes Gmail). */
export const GOOGLE_CALENDAR_CONNECT_SCOPE = [
  ...GOOGLE_IDENTITY_SCOPES,
  ...GOOGLE_GMAIL_SCOPES,
  ...GOOGLE_CALENDAR_SCOPES,
].join(" ");

export const CALENDAR_OAUTH_CALLBACK_PARAM = "calendar_connected";
export const CALENDAR_OAUTH_CALLBACK_URL = `/dashboard/settings?${CALENDAR_OAUTH_CALLBACK_PARAM}=1#integrations`;
