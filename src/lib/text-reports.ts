import type {
  Contact,
  DailyCall,
  LineNote,
  Production,
  Prop,
  RehearsalReport,
} from './db'
import { NOTE_DEPT_KEYS } from './db'
import {
  LINE_TYPE_LABELS,
  NOTE_DEPT_LABELS,
  PROP_SOURCE_LABELS,
  PROP_SPECIAL_HANDLING_LABELS,
  PROP_STATUS_LABELS,
} from './schemas'

// Plain-text renderers for each artifact, intended for inclusion in the
// distribution email body. This is the SM-conventional format — historically
// rehearsal reports go in the body, not as attachments. The PDF is the
// archival/formal version.

function formatLongDate(iso?: string): string {
  if (!iso) return '—'
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

const PRODUCTION_TYPE_LABELS: Record<Production['type'], string> = {
  play: 'Play',
  musical: 'Musical',
  devised: 'Devised',
  cabaret: 'Cabaret',
  other: 'Other',
}

const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  excused: 'Excused',
}

const CONTACT_CATEGORY_LABELS: Record<Contact['category'], string> = {
  cast: 'Cast',
  creative: 'Creative Team',
  production: 'Production Team',
  crew: 'Crew',
  'venue-admin': 'Venue & Administration',
}

const CONTACT_CATEGORY_ORDER: Contact['category'][] = [
  'cast',
  'creative',
  'production',
  'crew',
  'venue-admin',
]

const NOTE_DEPT_LABEL_MAP: Record<string, string> = Object.fromEntries(
  NOTE_DEPT_LABELS.map((d) => [d.key, d.label]),
)

/** Plain-text rehearsal report. Stern/Gold-style section order. */
export function renderRehearsalReportText(
  production: Production,
  report: RehearsalReport,
  contacts: readonly Contact[],
): string {
  const lines: string[] = []

  lines.push(production.name.toUpperCase())
  lines.push(`REHEARSAL REPORT — DAY ${report.dayNumber}`)
  const headerBits = [
    formatLongDate(report.date),
    `${report.startTime}–${report.endTime}`,
  ]
  if (report.location) headerBits.push(report.location)
  lines.push(headerBits.join(' | '))
  lines.push('')

  if (report.attendance.length > 0) {
    lines.push('ATTENDANCE')
    for (const a of report.attendance) {
      const name =
        contacts.find((c) => c.id === a.contactId)?.name ?? '(removed)'
      let statusText = ATTENDANCE_STATUS_LABELS[a.status] ?? a.status
      if (a.status === 'late' && a.minutesLate) {
        statusText += ` (${a.minutesLate} min)`
      }
      lines.push(`  ${name} — ${statusText}`)
    }
    lines.push('')
  }

  if (report.timeBlocks.length > 0) {
    lines.push('TIME BREAKDOWN')
    for (const tb of report.timeBlocks) {
      lines.push(`  ${tb.start}–${tb.end}   ${tb.activity}`)
    }
    lines.push('')
  }

  const hasNotes = NOTE_DEPT_KEYS.some(
    (k) => (report.notes[k]?.length ?? 0) > 0,
  )
  if (hasNotes) {
    lines.push('DEPARTMENTAL NOTES')
    lines.push('')
    for (const key of NOTE_DEPT_KEYS) {
      const list = report.notes[key]
      if (!list || list.length === 0) continue
      lines.push(NOTE_DEPT_LABEL_MAP[key].toUpperCase())
      list.forEach((n, i) => {
        lines.push(`  ${i + 1}. ${n.text}`)
      })
      lines.push('')
    }
  }

  return lines.join('\n').trimEnd()
}

/** Plain-text contact sheet. Excludes doNotPublish contacts and private fields. */
export function renderContactSheetText(
  production: Production,
  contacts: readonly Contact[],
): string {
  const publishable = contacts.filter((c) => !c.doNotPublish)
  const lines: string[] = []

  lines.push(production.name.toUpperCase())
  lines.push('CONTACT SHEET')
  lines.push('')

  for (const cat of CONTACT_CATEGORY_ORDER) {
    const list = publishable.filter((c) => c.category === cat)
    if (list.length === 0) continue
    lines.push(CONTACT_CATEGORY_LABELS[cat].toUpperCase())
    for (const c of list) {
      const headerBits = [c.name]
      if (c.pronouns) headerBits.push(`(${c.pronouns})`)
      if (c.role) headerBits.push(`— ${c.role}`)
      lines.push(`  ${headerBits.join(' ')}`)
      const contactBits: string[] = []
      if (c.email) contactBits.push(c.email)
      if (c.phone) contactBits.push(c.phone)
      if (contactBits.length > 0) {
        lines.push(`    ${contactBits.join(' · ')}`)
      }
    }
    lines.push('')
  }

  return lines.join('\n').trimEnd()
}

/** Plain-text prop list. */
export function renderPropListText(
  production: Production,
  props: readonly Prop[],
): string {
  const lines: string[] = []

  lines.push(production.name.toUpperCase())
  lines.push(
    `PROP LIST — ${props.length} item${props.length === 1 ? '' : 's'}`,
  )
  lines.push('')

  for (const p of props) {
    lines.push(`• ${p.name}${p.consumable ? ' (consumable)' : ''}`)
    const sceneCharBits: string[] = []
    if (p.scenes.length > 0)
      sceneCharBits.push(`Scenes: ${p.scenes.join(', ')}`)
    if (p.characters.length > 0)
      sceneCharBits.push(`Characters: ${p.characters.join(', ')}`)
    if (sceneCharBits.length > 0)
      lines.push(`    ${sceneCharBits.join(' | ')}`)
    lines.push(
      `    Status: ${PROP_STATUS_LABELS[p.status]} · Source: ${PROP_SOURCE_LABELS[p.source]}`,
    )
    if (p.specialHandling && p.specialHandling.length > 0) {
      const tags = p.specialHandling
        .map((t) => PROP_SPECIAL_HANDLING_LABELS[t])
        .join(', ')
      lines.push(`    Handling: ${tags}`)
    }
    if (p.tableLocation) lines.push(`    Table: ${p.tableLocation}`)
    if (p.notes) lines.push(`    Note: ${p.notes}`)
  }

  return lines.join('\n').trimEnd()
}

/** Plain-text production information sheet. */
export function renderProductionInfoText(production: Production): string {
  const lines: string[] = []

  lines.push(production.name.toUpperCase())
  lines.push('PRODUCTION INFORMATION')
  lines.push('')

  if (production.workingTitle)
    lines.push(`Working title: ${production.workingTitle}`)
  if (production.season) lines.push(`Season: ${production.season}`)
  lines.push(`Type: ${PRODUCTION_TYPE_LABELS[production.type]}`)
  if (production.organization)
    lines.push(`Organization: ${production.organization}`)
  if (production.venue) lines.push(`Venue: ${production.venue}`)
  lines.push('')

  const dates: Array<[string, string | undefined]> = [
    ['First rehearsal', production.firstRehearsal],
    ['Designer run', production.designerRun],
    ['Tech start', production.techStart],
    ['First preview', production.firstPreview],
    ['Opening', production.opening],
    ['Closing', production.closing],
  ]
  const datedDates = dates.filter(([, d]) => d)
  if (datedDates.length > 0) {
    lines.push('KEY DATES')
    for (const [label, date] of datedDates) {
      lines.push(`  ${label}: ${formatLongDate(date)}`)
    }
  }

  return lines.join('\n').trimEnd()
}

function abbreviateName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) return name
  const first = parts[0]!
  const last = parts[parts.length - 1]!
  return `${first[0]}. ${last}`
}

/** Plain-text daily call. Mirrors the PDF — header, notes, call times,
 *  schedule with abbreviated cast lists. */
export function renderDailyCallText(
  production: Production,
  call: DailyCall,
  contacts: readonly Contact[],
): string {
  const nameOf = (id: number) =>
    contacts.find((c) => c.id === id)?.name ?? '(removed)'

  const lines: string[] = []
  lines.push(production.name.toUpperCase())
  lines.push(`DAILY CALL${call.version > 1 ? ` (v${call.version})` : ''}`)
  lines.push(`${formatLongDate(call.date)}, ${call.location}`)
  lines.push('')

  if (call.notes.length > 0) {
    lines.push('NOTES')
    call.notes.forEach((n, i) => {
      lines.push(`  ${i + 1}. ${n.text}`)
    })
    lines.push('')
  }

  if (call.callTimes.length > 0) {
    lines.push('CALL TIME')
    for (const ct of call.callTimes) {
      lines.push(`  ${ct.time}  ${nameOf(ct.contactId)}`)
    }
    lines.push('')
  }

  if (call.scheduleItems.length > 0) {
    lines.push('REHEARSAL SCHEDULE')
    for (const item of call.scheduleItems) {
      lines.push(`  ${item.time}  ${item.activity}`)
      if (item.description) lines.push(`         ${item.description}`)
      let calledLine: string | null = null
      if (item.calledMode === 'all') calledLine = 'All called'
      else if (item.calledMode === 'company') calledLine = 'Full company'
      else if (item.calledMode === 'custom') {
        calledLine = item.customLabel?.trim() || null
      } else if (item.calledMode === 'specific') {
        const named = item.calledContactIds
          .map((id) => abbreviateName(nameOf(id)))
          .filter((n) => n !== '(removed)')
        calledLine = named.length > 0 ? named.join(', ') : null
      }
      if (calledLine) lines.push(`         ${calledLine}`)
      lines.push('')
    }
  }

  lines.push('— Subject to change.')
  return lines.join('\n').trimEnd()
}

/** Plain-text per-actor line notes. Private — for that actor only. */
export function renderLineNotesText(
  production: Production,
  actor: Contact,
  notes: readonly LineNote[],
): string {
  const lines: string[] = []
  lines.push(production.name.toUpperCase())
  lines.push(`LINE NOTES — ${actor.name.toUpperCase()}`)
  lines.push('')

  if (notes.length === 0) {
    lines.push('No notes for this rehearsal cycle. Nice work.')
    return lines.join('\n')
  }

  for (const n of notes) {
    const metaBits: string[] = [n.rehearsalDate]
    if (n.page) metaBits.push(`p.${n.page}`)
    metaBits.push(LINE_TYPE_LABELS[n.lineType])
    lines.push(metaBits.join(' · '))
    if (n.scriptedText) lines.push(`  Scripted: ${n.scriptedText}`)
    if (n.spokenText) lines.push(`  Spoken: ${n.spokenText}`)
    if (n.comment) lines.push(`  Note: ${n.comment}`)
    lines.push('')
  }

  return lines.join('\n').trimEnd()
}
