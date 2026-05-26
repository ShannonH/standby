import { Link } from 'react-router-dom'
import {
  useLineNotes,
  useRehearsals,
  useSendLog,
  useShowReports,
} from '@/lib/hooks'
import { daysBetween, todayISO, phaseInfo, type Phase } from '@/lib/today'
import type { Production } from '@/lib/db'

interface Props {
  production: Production
}

interface Nudge {
  /** Stable key for React. */
  key: string
  /** Imperative sentence. */
  text: string
  /** Where to go to act on it. */
  to: string
}

/**
 * Gentle nudges based on production state. Shows things the SM probably
 * wants to follow up on:
 *   - line notes typed but never delivered to actors
 *   - rehearsal reports never distributed
 *   - show reports never distributed
 *   - a long gap since the last rehearsal report during the rehearsal
 *     phase (suggests one was missed)
 *
 * Returns null when there's nothing to nudge about — empty-state with
 * no copy is the desired UX: silence means "you're caught up."
 */
export default function AwaitingActions({ production }: Props) {
  const productionId = production.id ?? null
  const lineNotes = useLineNotes(productionId)
  const rehearsals = useRehearsals(productionId)
  const showReports = useShowReports(productionId)
  const sendLog = useSendLog(productionId, 200)
  const phase = phaseInfo(production).phase

  const nudges: Nudge[] = []

  // Undelivered line notes
  const undelivered = lineNotes.filter((n) => !n.delivered).length
  if (undelivered > 0) {
    nudges.push({
      key: 'undelivered-line-notes',
      text: `${undelivered} line note${undelivered === 1 ? '' : 's'} haven't been delivered to actors yet.`,
      to: '/line-notes',
    })
  }

  // Rehearsals run but never distributed (matched by day-number heuristic)
  const undistributedRehearsals = countUndistributed(
    rehearsals.map((r) => `Day ${r.dayNumber}`),
    sendLog.map((s) => s.artifact),
    (label) => `Rehearsal Report — ${label}`,
  )
  if (undistributedRehearsals > 0) {
    nudges.push({
      key: 'undistributed-rehearsals',
      text: `${undistributedRehearsals} rehearsal report${undistributedRehearsals === 1 ? '' : 's'} not yet distributed.`,
      to: '/rehearsals',
    })
  }

  // Show reports never distributed
  const undistributedShows = countUndistributed(
    showReports.map((r) => r.performanceLabel),
    sendLog.map((s) => s.artifact),
    (label) => `Show Report — ${label}`,
  )
  if (undistributedShows > 0) {
    nudges.push({
      key: 'undistributed-shows',
      text: `${undistributedShows} show report${undistributedShows === 1 ? '' : 's'} not yet distributed.`,
      to: '/show-reports',
    })
  }

  // Gap nudge: in rehearsal phase, last report > 2 days ago
  const gap = rehearsalGapNudge(rehearsals, phase)
  if (gap) nudges.push(gap)

  if (nudges.length === 0) return null

  return (
    <section
      aria-labelledby="awaiting-heading"
      className="rounded-lg border border-surface-border bg-card p-5"
    >
      <h3
        id="awaiting-heading"
        className="font-display text-lg"
      >
        Standing by
      </h3>
      <p className="mt-1 text-xs text-muted">
        A few things that look like they're waiting on you. Dismiss any of
        these by completing the underlying action.
      </p>
      <ul className="mt-3 space-y-2">
        {nudges.map((n) => (
          <li key={n.key} className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className="mt-1 text-[rgb(var(--accent))]"
            >
              •
            </span>
            <Link
              to={n.to}
              className="flex-1 text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))]"
            >
              {n.text}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Count items whose `artifactLabelFor(item)` doesn't appear in the
 *  artifacts list. Used to detect reports that were created but never
 *  passed through Distribute (and thus never logged). */
function countUndistributed<T extends string>(
  items: T[],
  artifacts: string[],
  artifactLabelFor: (item: T) => string,
): number {
  const seen = new Set(artifacts)
  let count = 0
  for (const it of items) {
    if (!seen.has(artifactLabelFor(it))) count++
  }
  return count
}

function rehearsalGapNudge(
  rehearsals: ReadonlyArray<{ date: string; dayNumber: number }>,
  phase: Phase,
): Nudge | null {
  if (phase !== 'rehearsal' && phase !== 'tech') return null
  if (rehearsals.length === 0) return null
  const last = rehearsals[0]! // most-recent first
  const gap = daysBetween(last.date, todayISO())
  if (gap < 2) return null
  return {
    key: 'rehearsal-gap',
    text: `It's been ${gap} days since the last rehearsal report (Day ${last.dayNumber}). Catch up?`,
    to: '/rehearsals',
  }
}
