// Display-time formatting. Standby stores times as HH:MM in 24-hour because
// that's what the HTML `<input type="time">` always emits — but we format
// them for display per the user's setting, which defaults to 12-hour
// because that's the US theater convention.

export type TimeFormat = '12h' | '24h'

/**
 * Convert a stored "HH:MM" string to the user's preferred display format.
 *
 * 12h examples:  "18:00" → "6:00p"   "10:00" → "10:00a"
 *                "00:30" → "12:30a"  "12:00" → "12:00p"
 *
 * 24h examples: "18:00" → "18:00"   "06:00" → "06:00"
 *
 * If the input doesn't look like HH:MM (e.g. a freeform schedule-item
 * string like "10:15a" the SM typed by hand), it's returned unchanged.
 */
export function formatTime(time: string | undefined, format: TimeFormat): string {
  if (!time) return ''
  const match = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return time
  const hh = parseInt(match[1]!, 10)
  const mm = match[2]!
  if (Number.isNaN(hh)) return time
  if (format === '24h') {
    return `${String(hh).padStart(2, '0')}:${mm}`
  }
  return format12h(hh, mm)
}

function format12h(hh: number, mm: string): string {
  if (hh === 0) return `12:${mm}a`
  if (hh < 12) return `${hh}:${mm}a`
  if (hh === 12) return `12:${mm}p`
  return `${hh - 12}:${mm}p`
}
