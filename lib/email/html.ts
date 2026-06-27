/** Convert plain text (from AI) into safe HTML for the composer. */
export function plainTextToHtml(text: string): string {
  if (!text) return "";

  return text
    .split("\n")
    .map((line) => {
      const escaped = escapeHtml(line);
      return line.length === 0 ? "<br>" : `<p>${escaped}</p>`;
    })
    .join("");
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function htmlToPlainText(html: string): string {
  if (!html) return "";

  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function isComposerEmpty(plain: string, html: string): boolean {
  return !plain.trim() && !htmlToPlainText(html).trim();
}

export function hasRichFormatting(html: string): boolean {
  return /<(b|strong|i|em|u|ul|ol|li|p)\b/i.test(html);
}
