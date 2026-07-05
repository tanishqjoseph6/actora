const cache = new Map<string, string>();

export function getCachedSummary(emailId: string): string | null {
  return cache.get(emailId) ?? null;
}

export function setCachedSummary(emailId: string, summary: string): void {
  cache.set(emailId, summary);
}

export function clearCachedSummary(emailId: string): void {
  cache.delete(emailId);
}
