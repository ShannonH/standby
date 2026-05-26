import type { Production } from './db'

// ─── Phase + countdown logic for the Today dashboard ─────────────────────
//
// Standby's Today view leans hard on these helpers — they translate
// abstract production dates into "where are we right now in this show's
// life?" answers. Phase names match the conventional SM vocabulary:
// pre-production → rehearsal → tech → previews → performance → closed.

export type Phase =
  | 'pre-production' // no rehearsals started yet (or no dates set)
  | 'rehearsal' // between firstRehearsal and techStart
  | 'tech' // between techStart and firstPreview (or opening if no previews)
  | 'previews' // between firstPreview and opening
  | 'performance' // between opening and closing
  | 'closed' // past closing
  | 'undated' // production has zero date fields filled

export interface PhaseInfo {
  phase: Phase
  /** The next milestone date in the show's life, or null if all in the
   *  past / no dates set. */
  nextMilestone: Milestone | null
  /** All known milestones in chronological order. */
  milestones: Milestone[]
  /** Days between today and `nextMilestone.date`, negative if past. */
  daysUntilNext: number | null
}

export interface Milestone {
  key:
    | 'firstRehearsal'
    | 'designerRun'
    | 'techStart'
    | 'firstPreview'
    | 'opening'
    | 'closing'
  /** Short display label, e.g. "Opening" or "First rehearsal". */
  label: string
  /** ISO yyyy-mm-dd string. */
  date: string
}

const MILESTONE_LABELS: Record<Milestone['key'], string> = {
  firstRehearsal: 'First rehearsal',
  designerRun: 'Designer run',
  techStart: 'Tech start',
  firstPreview: 'First preview',
  opening: 'Opening',
  closing: 'Closing',
}

/** Today as a yyyy-mm-dd string, computed in local time. Standby is a
 *  local-first app; everyone's "today" is their wall-clock today. */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Whole-day delta between two yyyy-mm-dd strings (b - a). Positive if b
 *  is after a. Computed via UTC midnight so DST doesn't shift the count
 *  off-by-one across a spring/fall boundary. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  if (!ay || !am || !ad || !by || !bm || !bd) return 0
  const aUtc = Date.UTC(ay, am - 1, ad)
  const bUtc = Date.UTC(by, bm - 1, bd)
  return Math.round((bUtc - aUtc) / 86_400_000)
}

/** Build the ordered milestone list, dropping any unset dates. */
export function milestonesFor(production: Production): Milestone[] {
  const keys: Milestone['key'][] = [
    'firstRehearsal',
    'designerRun',
    'techStart',
    'firstPreview',
    'opening',
    'closing',
  ]
  return keys
    .map((key): Milestone | null => {
      const date = production[key]
      if (!date) return null
      return { key, label: MILESTONE_LABELS[key], date }
    })
    .filter((m): m is Milestone => m !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Compute current phase + next milestone for a production. */
export function phaseInfo(
  production: Production,
  today: string = todayISO(),
): PhaseInfo {
  const milestones = milestonesFor(production)

  if (milestones.length === 0) {
    return {
      phase: 'undated',
      nextMilestone: null,
      milestones: [],
      daysUntilNext: null,
    }
  }

  // Next milestone = first one whose date is >= today.
  const upcoming = milestones.find((m) => m.date >= today) ?? null
  const daysUntilNext = upcoming ? daysBetween(today, upcoming.date) : null

  let phase: Phase
  const fr = production.firstRehearsal
  const ts = production.techStart
  const fp = production.firstPreview
  const op = production.opening
  const cl = production.closing

  if (cl && today > cl) phase = 'closed'
  else if (op && today >= op) phase = 'performance'
  else if (fp && today >= fp) phase = 'previews'
  else if (ts && today >= ts) phase = 'tech'
  else if (fr && today >= fr) phase = 'rehearsal'
  else phase = 'pre-production'

  return { phase, nextMilestone: upcoming, milestones, daysUntilNext }
}

/** Plain-English label for a phase. */
export function phaseLabel(phase: Phase): string {
  switch (phase) {
    case 'pre-production':
      return 'Pre-production'
    case 'rehearsal':
      return 'Rehearsal'
    case 'tech':
      return 'Tech'
    case 'previews':
      return 'Previews'
    case 'performance':
      return 'In performance'
    case 'closed':
      return 'Closed'
    case 'undated':
      return ''
  }
}

/** Convert a day-count delta into a relative phrasing.
 *
 *  0 → "today"     1 → "tomorrow"     -1 → "yesterday"
 *  N>1 → "in N days"   N<-1 → "N days ago" */
export function relativeDayPhrase(deltaDays: number): string {
  if (deltaDays === 0) return 'today'
  if (deltaDays === 1) return 'tomorrow'
  if (deltaDays === -1) return 'yesterday'
  if (deltaDays > 1) return `in ${deltaDays} days`
  return `${Math.abs(deltaDays)} days ago`
}

/** Theatrical phrasing for the countdown hero. Returns a 1-2 line
 *  message keyed off phase + days-until-next. The first line is the
 *  big text; the second is the supporting detail. */
export function countdownPhrase(
  info: PhaseInfo,
  today: string = todayISO(),
): {
  big: string
  small: string
} {
  const { phase, nextMilestone, daysUntilNext } = info

  if (phase === 'undated') {
    return {
      big: 'Set your show dates',
      small: 'Add a first rehearsal or opening date to see your countdown.',
    }
  }

  if (phase === 'closed') {
    const closing = info.milestones.find((m) => m.key === 'closing')
    const sinceClose = closing ? daysBetween(closing.date, today) : 0
    return {
      big: 'The show is closed.',
      small:
        sinceClose === 0
          ? 'Closing was today.'
          : `Closed ${relativeDayPhrase(-sinceClose)}.`,
    }
  }

  if (!nextMilestone || daysUntilNext === null) {
    return { big: phaseLabel(phase), small: '' }
  }

  // Special-case "TODAY" / "TONIGHT" / "TOMORROW" for the big number.
  if (daysUntilNext === 0) {
    return {
      big: `${nextMilestone.label} — TODAY`,
      small: longDate(nextMilestone.date),
    }
  }
  if (daysUntilNext === 1) {
    return {
      big: `${nextMilestone.label} — tomorrow`,
      small: longDate(nextMilestone.date),
    }
  }

  // Phase-flavored phrasing for "N days until X"
  const base = `${nextMilestone.label} in ${daysUntilNext} days.`
  return {
    big: base,
    small: longDate(nextMilestone.date),
  }
}

/** "Saturday, July 25, 2026" from "2026-07-25". */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/** "Jul 25" from "2026-07-25". */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
