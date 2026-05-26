import type { Production } from '@/lib/db'
import {
  milestonesFor,
  phaseInfo,
  shortDate,
  todayISO,
  type Milestone,
} from '@/lib/today'

interface Props {
  production: Production
}

type MilestoneState = 'past' | 'current' | 'future'

function stateFor(m: Milestone, nextKey: string | undefined): MilestoneState {
  const today = todayISO()
  if (m.date < today) return 'past'
  if (m.key === nextKey) return 'current'
  return 'future'
}

/**
 * Horizontal milestone timeline. Each milestone is a dot + label + date,
 * with a connecting line between them. Past milestones are checked,
 * the next-upcoming is bright (accent), future ones are dimmed.
 *
 * Returns null if the production has zero dates — the empty timeline
 * isn't useful and we'd rather nudge the user toward filling dates in
 * via the CountdownHero copy.
 */
export default function MilestoneStrip({ production }: Props) {
  const milestones = milestonesFor(production)
  if (milestones.length === 0) return null
  const { nextMilestone } = phaseInfo(production)

  return (
    <section
      aria-label="Production milestones"
      className="rounded-lg border border-surface-border bg-card p-4 sm:p-6"
    >
      <ol className="grid gap-3 sm:flex sm:items-start sm:justify-between sm:gap-0">
        {milestones.map((m, idx) => {
          const state = stateFor(m, nextMilestone?.key)
          const isLast = idx === milestones.length - 1
          return (
            <li
              key={m.key}
              className="relative flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center"
            >
              <Dot state={state} />
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`hidden sm:absolute sm:left-1/2 sm:top-3 sm:block sm:h-0.5 sm:w-full ${
                    state === 'past'
                      ? 'bg-[rgb(var(--accent))]'
                      : 'bg-surface-border'
                  }`}
                />
              )}
              <div className="sm:mt-3">
                <p
                  className={`text-sm font-medium ${
                    state === 'current'
                      ? 'text-[rgb(var(--accent))]'
                      : state === 'past'
                        ? 'text-muted line-through decoration-1'
                        : ''
                  }`}
                >
                  {m.label}
                </p>
                <p className="text-xs text-muted">{shortDate(m.date)}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function Dot({ state }: { state: MilestoneState }) {
  const base =
    'relative z-10 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold'
  if (state === 'past') {
    return (
      <span
        aria-label="past milestone"
        className={`${base} border-[rgb(var(--accent))] bg-[rgb(var(--accent))] text-[rgb(var(--on-accent))]`}
      >
        ✓
      </span>
    )
  }
  if (state === 'current') {
    return (
      <span
        aria-label="next milestone"
        className={`${base} border-[rgb(var(--accent))] bg-card text-[rgb(var(--accent))]`}
      >
        ●
      </span>
    )
  }
  return (
    <span
      aria-label="future milestone"
      className={`${base} border-surface-border bg-card text-muted`}
    >
      ○
    </span>
  )
}
