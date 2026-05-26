// Friendly relative-time formatting for activity feeds, audit logs, and
// any "when did this happen" timestamp shown in the UI.
//
// The rule of thumb: in the last hour show minutes; today show hours;
// yesterday say "yesterday"; under a week say N days; further back show
// the actual date so the reader has a concrete anchor.

/**
 * Convert an ISO timestamp to a human-friendly relative string.
 *
 * - Under 2 minutes: "just now"
 * - Under 1 hour:    "12m ago"
 * - Under 24 hours:  "3h ago"
 * - Under 48 hours:  "yesterday"
 * - Under 7 days:    "3 days ago"
 * - 7+ days:         locale-formatted date ("Jun 22" or "Jun 22, 2025"
 *                    if more than ~10 months out)
 *
 * `now` is injectable for tests.
 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return iso
  const diffMs = now.getTime() - then
  const min = 60_000
  const hour = 60 * min
  const day = 24 * hour
  if (diffMs < 2 * min) return 'just now'
  if (diffMs < hour) return `${Math.floor(diffMs / min)}m ago`
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`
  if (diffMs < 2 * day) return 'yesterday'
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)} days ago`

  // Older than a week — show the date. Include year for things older
  // than ~10 months so audit-log readers don't have to guess.
  const sameYearish = diffMs < 300 * day
  return new Date(then).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYearish ? {} : { year: 'numeric' }),
  })
}
