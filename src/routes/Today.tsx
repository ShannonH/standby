import { Link } from 'react-router-dom'
import AwaitingActions from '@/features/today/AwaitingActions'
import CountdownHero from '@/features/today/CountdownHero'
import MilestoneStrip from '@/features/today/MilestoneStrip'
import NextCallCard from '@/features/today/NextCallCard'
import RecentActivity from '@/features/today/RecentActivity'
import StatsRow from '@/features/today/StatsRow'
import { greet } from '@/lib/greeting'
import { useCurrentProduction, useProductions } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'

/**
 * Today is the dashboard. With no production, it's a welcome screen.
 * With a production loaded, it's a dense at-a-glance view of where the
 * show is in its lifecycle and what's standing by.
 *
 * Composition order is intentional: hero countdown first (the answer to
 * "where are we?"), milestone strip second (the timeline), then a stats
 * row (the numbers), then optional next-call / awaiting-actions / recent
 * activity panels. Optional panels render null when they have nothing
 * to say — silence on Today means "you're caught up."
 */
export default function Today() {
  const productions = useProductions()
  const current = useCurrentProduction()
  const userName = useAppStore((s) => s.settings.userName) ?? ''
  const greeting = greet(userName)
  const trimmedName = userName.trim()

  if (productions.length === 0) {
    return (
      <section className="mx-auto max-w-3xl">
        <h2 className="font-display text-3xl">
          {trimmedName
            ? `Welcome to Standby, ${trimmedName}.`
            : 'Welcome to Standby'}
        </h2>
        <p className="mt-3 text-muted">
          A free, offline-first paperwork hub for theatre stage managers.
          Your shows live in your browser; nothing leaves this device
          unless you export it.
        </p>
        <p className="mt-6">
          <Link
            to="/production"
            className="inline-block rounded bg-[rgb(var(--accent))] px-4 py-2 text-sm font-semibold text-[rgb(var(--on-accent))] hover:bg-[rgb(var(--accent-hover))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))]"
          >
            Set up your first production →
          </Link>
        </p>
      </section>
    )
  }

  if (!current) {
    return (
      <section className="mx-auto max-w-3xl">
        <p className="text-sm italic text-muted">{greeting}</p>
        <h2 className="mt-1 font-display text-3xl">Today</h2>
        <p className="mt-3 text-muted">
          No production is currently selected.
        </p>
        <p className="mt-2">
          <Link to="/production" className="underline">
            Pick one or create a new one →
          </Link>
        </p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-sm italic text-muted">{greeting}</p>
        <h2 className="mt-1 font-display text-3xl">{current.name}</h2>
        <p className="text-sm text-muted">
          {current.type}
          {current.season ? ` · ${current.season}` : ''}
          {current.organization ? ` · ${current.organization}` : ''}
        </p>
      </header>

      <CountdownHero production={current} />
      <MilestoneStrip production={current} />

      <StatsRow production={current} />

      <div className="grid gap-6 lg:grid-cols-2">
        <NextCallCard production={current} />
        <AwaitingActions production={current} />
      </div>

      <RecentActivity production={current} />
    </section>
  )
}
