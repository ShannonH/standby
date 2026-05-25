/** Time-of-day greeting helper. Picks a salutation that fits the hour —
 *  including a gentle nod for the SM still at it past 10 pm, since
 *  rehearsals run late. */

export type GreetingKind =
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'late-night'

export function pickGreetingKind(now: Date = new Date()): GreetingKind {
  const h = now.getHours()
  if (h < 5) return 'late-night'
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  if (h < 22) return 'evening'
  return 'late-night'
}

const SALUTATIONS: Record<GreetingKind, string> = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
  'late-night': 'Long night',
}

/**
 * Returns a single greeting line. If the name is empty the salutation
 * stands on its own (no trailing comma); if a name is provided it's
 * appended after a comma and the salutation gets a period.
 *
 *   greet('Rayne')   // "Good evening, Rayne."
 *   greet('')        // "Good evening."
 *   greet(undefined) // "Good evening."
 *
 * `name` is loosely typed to defend against persisted-state hydration
 * lag (e.g. a Zustand store loading an older settings snapshot that
 * doesn't yet have the userName field).
 */
export function greet(
  name: string | undefined | null,
  now: Date = new Date(),
): string {
  const kind = pickGreetingKind(now)
  const salutation = SALUTATIONS[kind]
  const trimmed = (name ?? '').trim()
  return trimmed.length > 0
    ? `${salutation}, ${trimmed}.`
    : `${salutation}.`
}
