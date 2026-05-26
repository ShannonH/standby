import type { Production } from '@/lib/db'
import { countdownPhrase, phaseInfo, phaseLabel } from '@/lib/today'

interface Props {
  production: Production
}

/**
 * The hero card on the Today dashboard. Shows the next big milestone in
 * theatrical phrasing — "Opening in 12 days." / "Opening — TONIGHT." /
 * "The show is closed." — plus a small phase tag.
 *
 * The card is intentionally minimal: one big sentence, one supporting
 * line, one phase chip. The phase chip is the only colored element; the
 * rest borrows from the active theme's typography for personality.
 */
export default function CountdownHero({ production }: Props) {
  const info = phaseInfo(production)
  const { big, small } = countdownPhrase(info)
  const phase = phaseLabel(info.phase)

  return (
    <section
      aria-labelledby="countdown-hero-heading"
      className="rounded-lg border border-surface-border bg-card p-6 sm:p-8"
    >
      {phase && (
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[rgb(var(--accent))]">
          {phase}
        </p>
      )}
      <h3
        id="countdown-hero-heading"
        className="font-display text-3xl leading-tight sm:text-4xl"
      >
        {big}
      </h3>
      {small && (
        <p className="mt-2 text-sm text-muted sm:text-base">{small}</p>
      )}
    </section>
  )
}
