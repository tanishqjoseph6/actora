export type SendProductionEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  tags?: { name: string; value: string }[];
  /** Logical category for logs (trial, auth, billing, …). */
  category?: string;
};

export type SendProductionEmailResult = {
  sent: boolean;
  id?: string | null;
  skipped?: string;
  error?: string;
};
