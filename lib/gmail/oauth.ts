import { google } from "googleapis";

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
}

export function applyOAuthCredentials(
  client: InstanceType<typeof google.auth.OAuth2>,
  tokens: {
    accessToken: string;
    refreshToken?: string | null;
  }
) {
  client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken ?? undefined,
  });
  return client;
}

export async function getGmailProfileEmail(
  auth: InstanceType<typeof google.auth.OAuth2>
): Promise<string> {
  const gmail = google.gmail({ version: "v1", auth });
  const profile = await gmail.users.getProfile({ userId: "me" });
  const email = profile.data.emailAddress;

  if (!email) {
    throw new Error("Could not read Gmail profile email.");
  }

  return email;
}

export async function refreshOAuthTokens(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}> {
  const client = createOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error("Failed to refresh Gmail access token.");
  }

  const expiresAt = credentials.expiry_date
    ? new Date(credentials.expiry_date).toISOString()
    : new Date(Date.now() + 3600 * 1000).toISOString();

  return {
    accessToken: credentials.access_token,
    refreshToken: credentials.refresh_token ?? refreshToken,
    expiresAt,
  };
}

export function isTokenExpired(
  tokenExpiresAt: string | null | undefined,
  bufferMs = 60_000
): boolean {
  if (!tokenExpiresAt) return false;
  return Date.now() >= new Date(tokenExpiresAt).getTime() - bufferMs;
}
