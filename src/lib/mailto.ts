/**
 * Build a `mailto:` URL with the given BCC recipients, subject, and body.
 *
 * Why not URLSearchParams? URLSearchParams uses application/x-www-form-
 * urlencoded encoding, which encodes spaces as `+`. RFC 6068 (mailto:)
 * requires percent-encoding per RFC 3986 — spaces become `%20`. Some mail
 * clients (Apple Mail, Gmail web) tolerate `+`-as-space; others (Outlook,
 * Thunderbird in some configs) treat `+` literally. So we encode by hand
 * with encodeURIComponent and keep commas as raw delimiters between
 * addresses, only encoding the address strings themselves defensively.
 */
export function buildMailtoUrl(
  bccRecipients: readonly string[],
  subject: string,
  body: string,
): string {
  const bcc = bccRecipients.map(encodeURIComponent).join(',')
  const params: string[] = []
  if (bcc.length > 0) params.push(`bcc=${bcc}`)
  if (subject.length > 0) params.push(`subject=${encodeURIComponent(subject)}`)
  if (body.length > 0) params.push(`body=${encodeURIComponent(body)}`)
  return params.length === 0 ? 'mailto:' : `mailto:?${params.join('&')}`
}
