import { Link } from 'react-router-dom'
import {
  useContacts,
  useLineNotes,
  useProps,
  useRehearsals,
  useShowReports,
} from '@/lib/hooks'
import { phaseInfo, type Phase } from '@/lib/today'
import type { Production } from '@/lib/db'

interface Props {
  production: Production
}

/**
 * Row of small stat cards. Each card is a link to the relevant route —
 * they double as both at-a-glance numbers and a secondary nav surface.
 *
 * Which cards show is keyed off phase: show reports only appear once
 * we're in previews/performance, and the rehearsal-count card swaps to
 * "performances" once the show is running.
 */
export default function StatsRow({ production }: Props) {
  const productionId = production.id ?? null
  const contacts = useContacts(productionId)
  const rehearsals = useRehearsals(productionId)
  const props = useProps(productionId)
  const lineNotes = useLineNotes(productionId)
  const showReports = useShowReports(productionId)
  const phase = phaseInfo(production).phase

  const propsSourced = props.filter(
    (p) => p.status === 'sourced' || p.status === 'built',
  ).length
  const propsNeeded = props.filter((p) => p.status === 'needed').length
  const undeliveredNotes = lineNotes.filter((n) => !n.delivered).length

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      <StatCard
        to="/contacts"
        label="Contacts"
        value={contacts.length}
        sub={subForContacts(contacts.length)}
      />

      {showCardsForPhase(phase).reportsCount && (
        <StatCard
          to="/rehearsals"
          label="Rehearsal reports"
          value={rehearsals.length}
          sub={lastRehearsalSub(rehearsals)}
        />
      )}

      <StatCard
        to="/props"
        label="Props"
        value={`${propsSourced}/${props.length}`}
        sub={
          propsNeeded > 0
            ? `${propsNeeded} still needed`
            : props.length > 0
              ? 'all sourced'
              : 'none yet'
        }
        emphasize={propsNeeded > 0}
      />

      <StatCard
        to="/line-notes"
        label="Line notes"
        value={lineNotes.length}
        sub={
          undeliveredNotes > 0
            ? `${undeliveredNotes} to deliver`
            : lineNotes.length > 0
              ? 'all delivered'
              : 'none yet'
        }
        emphasize={undeliveredNotes > 0}
      />

      {showCardsForPhase(phase).showReports && showReports.length > 0 && (
        <StatCard
          to="/show-reports"
          label="Show reports"
          value={showReports.length}
          sub={`through perf #${maxPerformanceNumber(showReports)}`}
        />
      )}
    </ul>
  )
}

function showCardsForPhase(phase: Phase) {
  return {
    reportsCount: phase !== 'undated',
    showReports:
      phase === 'previews' ||
      phase === 'performance' ||
      phase === 'closed',
  }
}

function subForContacts(n: number): string {
  if (n === 0) return 'add your first'
  if (n === 1) return '1 person'
  return `${n} people`
}

function lastRehearsalSub(
  rehearsals: ReadonlyArray<{ dayNumber: number; date: string }>,
): string {
  if (rehearsals.length === 0) return 'none yet'
  const last = rehearsals[0]! // already sorted desc by date
  return `through Day ${last.dayNumber}`
}

function maxPerformanceNumber(
  reports: ReadonlyArray<{ performanceNumber: number }>,
): number {
  return reports.reduce((m, r) => Math.max(m, r.performanceNumber), 0)
}

interface StatCardProps {
  to: string
  label: string
  value: number | string
  sub: string
  /** When true, the sub-line uses accent color — used to flag "you have
   *  X things waiting" states like undelivered line notes. */
  emphasize?: boolean
}

function StatCard({ to, label, value, sub, emphasize }: StatCardProps) {
  return (
    <li>
      <Link
        to={to}
        className="group block rounded-lg border border-surface-border bg-card p-4 transition hover:border-[rgb(var(--accent))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))]"
      >
        <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
        <p
          className={`mt-1 text-xs ${
            emphasize ? 'text-[rgb(var(--accent))]' : 'text-muted'
          }`}
        >
          {sub}
        </p>
      </Link>
    </li>
  )
}
