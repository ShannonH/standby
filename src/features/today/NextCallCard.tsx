import { Link } from 'react-router-dom'
import { useDailyCalls } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { daysBetween, todayISO } from '@/lib/today'
import { formatTime } from '@/lib/time-format'
import type { Production } from '@/lib/db'

interface Props {
  production: Production
}

/**
 * Surfaces the next upcoming daily call (today, tomorrow, or the very
 * next one within a week). If there's nothing on the horizon, the card
 * is hidden — we don't want to draw attention to absent calls during
 * a long break in the rehearsal schedule.
 *
 * When multiple revisions exist for the same date, we pick the latest
 * version (matching the useDailyCalls sort: date desc, then version
 * desc).
 */
export default function NextCallCard({ production }: Props) {
  const productionId = production.id ?? null
  const calls = useDailyCalls(productionId)
  const timeFormat = useAppStore((s) => s.settings.timeFormat)

  const today = todayISO()
  // calls are sorted date desc / version desc. Find the most-recent call
  // that's still today or in the future. We collapse same-date revisions
  // by tracking which dates we've already seen.
  const seenDates = new Set<string>()
  const future = []
  for (const c of calls) {
    if (c.date < today) break
    if (seenDates.has(c.date)) continue
    seenDates.add(c.date)
    future.push(c)
  }
  // Pick the soonest upcoming = the last one in our reverse-sorted list
  const next = future[future.length - 1] ?? null

  if (!next) return null
  const delta = daysBetween(today, next.date)
  if (delta > 7) return null // don't surface calls further than a week out

  const when =
    delta === 0
      ? 'Today'
      : delta === 1
        ? 'Tomorrow'
        : new Date(Date.UTC(...parseISO(next.date))).toLocaleDateString(
            'en-US',
            { weekday: 'long', timeZone: 'UTC' },
          )

  // Find the earliest call time so we can surface it ("first call: 6:00p")
  const earliest = earliestCallTime(next.callTimes.map((ct) => ct.time))

  return (
    <section
      aria-labelledby="next-call-heading"
      className="rounded-lg border border-[rgb(var(--accent))]/40 bg-card p-5"
    >
      <p className="text-xs font-medium uppercase tracking-widest text-[rgb(var(--accent))]">
        Next call · {when}
      </p>
      <h3 id="next-call-heading" className="mt-1 font-display text-xl">
        {next.location || 'Daily call'}
        {next.version > 1 && (
          <span className="ml-2 align-middle text-xs text-muted">
            v{next.version}
          </span>
        )}
      </h3>
      <p className="mt-1 text-sm text-muted">
        {earliest
          ? `First call: ${formatTime(earliest, timeFormat)}`
          : 'No call times set yet.'}
        {' · '}
        {next.scheduleItems.length} item
        {next.scheduleItems.length === 1 ? '' : 's'} scheduled
      </p>
      <p className="mt-3">
        <Link
          to="/daily-call"
          className="text-sm font-medium text-[rgb(var(--accent))] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))]"
        >
          Open the call →
        </Link>
      </p>
    </section>
  )
}

function parseISO(iso: string): [number, number, number] {
  const [y, m, d] = iso.split('-').map(Number)
  return [y ?? 1970, (m ?? 1) - 1, d ?? 1]
}

/** Earliest HH:MM string in a list, or undefined for an empty list.
 *  String compare works because HH:MM is zero-padded. */
function earliestCallTime(times: string[]): string | undefined {
  if (times.length === 0) return undefined
  return times.reduce((min, t) => (t < min ? t : min), times[0]!)
}
