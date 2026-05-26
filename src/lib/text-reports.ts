import type {
  Contact,
  DailyCall,
  LineNote,
  Production,
  Prop,
  RehearsalReport,
  ShowReport,
} from './db'
import { NOTE_DEPT_KEYS } from './db'
import { useAppStore } from './store'
import { formatTime } from './time-format'
import {
  INCIDENT_KIND_LABELS,
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
  const timeFormat = useAppStore.getState().settings.timeFormat
  const lines: string[] = []

  lines.push(production.name.toUpperCase())
  lines.push(`REHEARSAL REPORT — DAY ${report.dayNumber}`)
  const headerBits = [
    formatLongDate(report.date),
    `${formatTime(report.startTime, timeFormat)}–${formatTime(report.endTime, timeFormat)}`,
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
      lines.push(
        `  ${formatTime(tb.start, timeFormat)}–${formatTime(tb.end, timeFormat)}   ${tb.activity}`,
      )
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
  const timeFormat = useAppStore.getState().settings.timeFormat
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
      lines.push(`  ${formatTime(ct.time, timeFormat)}  ${nameOf(ct.contactId)}`)
    }
    lines.push('')
  }

  if (call.scheduleItems.length > 0) {
    lines.push('REHEARSAL SCHEDULE')
    for (const item of call.scheduleItems) {
      lines.push(`  ${formatTime(item.time, timeFormat)}  ${item.activity}`)
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

/** Minutes between two HH:MM times; null if unparseable or end < start. */
function durationMin(start: string, end: string): number | null {
  const a = start.match(/^(\d{1,2}):(\d{2})$/)
  const b = end.match(/^(\d{1,2}):(\d{2})$/)
  if (!a || !b) return null
  const sm = parseInt(a[1]!, 10) * 60 + parseInt(a[2]!, 10)
  const em = parseInt(b[1]!, 10) * 60 + parseInt(b[2]!, 10)
  if (em < sm) return null
  return em - sm
}

function fmtMin(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  return `${h}h ${String(m).padStart(2, '0')}m`
}

/** Plain-text show report. Same shape as the PDF, formatted for email body. */
export function renderShowReportText(
  production: Production,
  report: ShowReport,
  contacts: readonly Contact[],
): string {
  const timeFormat = useAppStore.getState().settings.timeFormat
  const nameOf = (id: number) =>
    contacts.find((c) => c.id === id)?.name ?? '(removed)'

  const lines: string[] = []
  lines.push(production.name.toUpperCase())
  lines.push(`SHOW REPORT — ${report.performanceLabel.toUpperCase()}`)

  const headerBits = [
    formatLongDate(report.date),
    `Curtain ${formatTime(report.curtainUp, timeFormat)}${
      report.curtainDown
        ? `–${formatTime(report.curtainDown, timeFormat)}`
        : ''
    }`,
  ]
  if (report.location) headerBits.push(report.location)
  lines.push(headerBits.join(' | '))

  const metaBits: string[] = [`Performance #${report.performanceNumber}`]
  if (typeof report.houseCount === 'number')
    metaBits.push(`House ${report.houseCount}`)
  if (typeof report.lateSeating === 'number')
    metaBits.push(`Late seating ${report.lateSeating}`)
  lines.push(metaBits.join(' | '))
  lines.push('')

  if (report.acts.length > 0 || report.intermissions.length > 0) {
    lines.push('RUN TIMES')
    let actTotal = 0
    let intTotal = 0
    let anyParseable = false
    for (const a of report.acts) {
      const d = durationMin(a.start, a.end)
      if (d !== null) {
        anyParseable = true
        actTotal += d
      }
      lines.push(
        `  ${a.label}: ${formatTime(a.start, timeFormat)}–${formatTime(a.end, timeFormat)}${
          d === null ? '' : `  (${fmtMin(d)})`
        }`,
      )
    }
    for (let i = 0; i < report.intermissions.length; i++) {
      const it = report.intermissions[i]!
      const d = durationMin(it.start, it.end)
      if (d !== null) intTotal += d
      lines.push(
        `  ${it.label || `Intermission ${i + 1}`}: ${formatTime(it.start, timeFormat)}–${formatTime(it.end, timeFormat)}${
          d === null ? '' : `  (${fmtMin(d)})`
        }`,
      )
    }
    if (anyParseable) {
      lines.push(`  Total acts: ${fmtMin(actTotal)}`)
      if (intTotal > 0) {
        lines.push(`  With intermission: ${fmtMin(actTotal + intTotal)}`)
      }
    }
    lines.push('')
  }

  if (report.holds.length > 0) {
    lines.push('HOLDS')
    for (const h of report.holds) {
      lines.push(`  ${h.when} — ${h.durationMinutes}m — ${h.reason}`)
    }
    lines.push('')
  }

  if (report.incidents.length > 0) {
    lines.push('INCIDENTS')
    for (const inc of report.incidents) {
      lines.push(`  [${INCIDENT_KIND_LABELS[inc.kind]}] ${inc.description}`)
    }
    lines.push('')
  }

  if (report.understudyChanges.length > 0) {
    lines.push('UNDERSTUDY / SWING CHANGES')
    for (const u of report.understudyChanges) {
      const bits = [`${nameOf(u.contactId)} as ${u.role}`]
      if (u.reason) bits.push(u.reason)
      lines.push(`  ${bits.join(' — ')}`)
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
