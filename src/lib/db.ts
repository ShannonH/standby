import Dexie, { type EntityTable } from 'dexie'

// Schema mirrors PRD §8 data model. Keep in sync with docs/PRD.md.
//
// IndexedDB CAN hold multiple productions; UI focuses on one "current"
// production (selected via Zustand store in src/lib/store.ts). All
// per-show entities carry productionId so they're scoped cleanly.

export interface Production {
  id?: number
  name: string
  workingTitle?: string
  season?: string
  type: 'play' | 'musical' | 'devised' | 'cabaret' | 'other'
  organization?: string
  venue?: string
  firstRehearsal?: string
  designerRun?: string
  techStart?: string
  firstPreview?: string
  opening?: string
  closing?: string
  equityMode?: boolean
  createdAt: string
  updatedAt: string
}

export interface Contact {
  id?: number
  productionId: number
  category: 'cast' | 'creative' | 'production' | 'crew' | 'venue-admin'
  name: string
  role?: string
  email?: string
  phone?: string
  pronouns?: string
  emergencyContact?: string
  allergiesMedical?: string
  notes?: string
  doNotPublish?: boolean
}

export interface ContactGroup {
  id?: number
  productionId: number
  name: string
  description?: string
  contactIds: number[]
}

export type PropSpecialHandling =
  | 'food'
  | 'weapons'
  | 'fire'
  | 'breakaway'
  | 'fragile'
  | 'liquid'

export interface Prop {
  id?: number
  productionId: number
  name: string
  scenes: string[]
  characters: string[]
  consumable: boolean
  source: 'rental' | 'build' | 'buy' | 'pulled' | 'actor-personal' | 'unknown'
  status: 'needed' | 'sourced' | 'in-rehearsal' | 'built' | 'lost-replace'
  tableLocation?: string
  specialHandling?: PropSpecialHandling[]
  notes?: string
}

export interface LineNote {
  id?: number
  productionId: number
  rehearsalDate: string
  page: string
  characterId: number
  lineType: 'paraphrase' | 'drop' | 'add' | 'jump' | 'missed-cue' | 'call-line'
  scriptedText: string
  spokenText: string
  comment?: string
  delivered?: boolean
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused'

export interface AttendanceEntry {
  contactId: number
  status: AttendanceStatus
  minutesLate?: number
}

export interface TimeBlock {
  start: string
  end: string
  activity: string
}

/** A single departmental note. Wrapped as an object so useFieldArray works
 *  natively and so we can add fields like `resolved` later without schema churn. */
export interface DeptNote {
  text: string
  resolved?: boolean
}

export interface RehearsalNotes {
  scenic: DeptNote[]
  costumes: DeptNote[]
  wigsMakeup: DeptNote[]
  props: DeptNote[]
  lighting: DeptNote[]
  sound: DeptNote[]
  projections: DeptNote[]
  music: DeptNote[]
  production: DeptNote[]
}

export const NOTE_DEPT_KEYS = [
  'scenic',
  'costumes',
  'wigsMakeup',
  'props',
  'lighting',
  'sound',
  'projections',
  'music',
  'production',
] as const

export type NoteDeptKey = (typeof NOTE_DEPT_KEYS)[number]

export function emptyRehearsalNotes(): RehearsalNotes {
  return {
    scenic: [],
    costumes: [],
    wigsMakeup: [],
    props: [],
    lighting: [],
    sound: [],
    projections: [],
    music: [],
    production: [],
  }
}

export interface RehearsalReport {
  id?: number
  productionId: number
  date: string
  dayNumber: number
  startTime: string
  endTime: string
  location?: string
  attendance: AttendanceEntry[]
  timeBlocks: TimeBlock[]
  notes: RehearsalNotes
}

export interface SendLogEntry {
  id?: number
  productionId: number
  sentAt: string
  artifact: string
  recipientGroup: string
  recipientCount: number
  pdfFilename?: string
}

// ─── Daily call ────────────────────────────────────────────────────────────
//
// The daily call is the *next-day* schedule the SM sends out the night before
// rehearsal: who's called at what time, plus an ordered schedule of activities
// with the cast called for each one. Distinct from the rehearsal report
// (which is the *after-the-fact* summary of what actually happened).

export interface DailyCallTime {
  contactId: number
  time: string // "10:00" — staggered per cast member when needed
}

export interface DailyCallNote {
  text: string
}

/** What appears under each schedule item in red. Modes:
 *   - 'all'      → renders "All called"
 *   - 'company'  → renders "Full company" (typical for meal break)
 *   - 'specific' → renders the abbreviated names of contactIds
 *   - 'custom'   → renders the customLabel string verbatim */
export type ScheduleCalledMode = 'all' | 'company' | 'specific' | 'custom'

export interface DailyCallScheduleItem {
  time: string // "10:00a", "2:15p" — kept as freeform string for "10:15a" style
  activity: string
  description?: string // optional secondary line, indented
  calledMode: ScheduleCalledMode
  calledContactIds: number[] // populated when calledMode === 'specific'
  customLabel?: string // populated when calledMode === 'custom'
}

export interface DailyCall {
  id?: number
  productionId: number
  date: string // "2026-06-15"
  location: string
  version: number // 1, 2, 3 for revisions of the same day's call
  notes: DailyCallNote[]
  callTimes: DailyCallTime[]
  scheduleItems: DailyCallScheduleItem[]
}

// ─── Master tracking sheet ─────────────────────────────────────────────────
//
// The ASM's bible during tech and run: who enters/exits where, what they're
// carrying, what the crew is doing in support. Each TrackingEntry is one
// event. If three actors enter together at the same moment, that's ONE entry
// with three contactIds, not three rows — the spreadsheet shape with "merged
// cells" disappears in favor of a clean data model.

export type TrackingEntryKind =
  | 'entry' // regular entrance / exit / crossover
  | 'scene-shift' // gray divider in the table, used as a section break
  | 'crew' // yellow row in the table — a crew action, not an actor action

export interface TrackingEntry {
  id?: number
  productionId: number
  /** Stable ordering across the whole show. Lower = earlier. */
  sequence: number
  /** Script page reference. "11", "12a", "5.1" — freeform string. */
  page: string
  kind: TrackingEntryKind
  /** Actor / crew references. Empty for scene-shift rows that only need a label. */
  contactIds: number[]
  /** Used when the "who" is a crew or character not in the contacts table.
   *  Renders verbatim in the WHO column when present. */
  whoOverride?: string
  /** What action — "ENT", "EXT", "EXT/ENT", "grab coin pouch", etc.
   *  Freeform string so house conventions are honored. */
  what: string
  /** Where — backstage position code. "RW", "LW", "LCAP", "ARB", etc.
   *  Freeform string. */
  where: string
  /** Scene label for scene-shift rows ("SCENE SHIFT", "Act 2 — top", etc.). */
  sceneLabel?: string
  /** Freeform notes — prop hand-offs, costume change reminders, etc. */
  notes?: string
}

// ─── Blocking schematic ────────────────────────────────────────────────────
//
// Zone-based blocking notation. The stage is divided into 9 standard areas
// (USR, USC, USL, SR, C, SL, DSR, DSC, DSL) following universal SM notation.
// Each BlockingEntry records all actor positions for a given script page —
// tap the zone, assign the actor, move to the next page.

export type StageZone =
  | 'USR' | 'USC' | 'USL'
  | 'SR'  | 'C'   | 'SL'
  | 'DSR' | 'DSC' | 'DSL'

export const STAGE_ZONES: readonly StageZone[] = [
  'USR', 'USC', 'USL',
  'SR',  'C',   'SL',
  'DSR', 'DSC', 'DSL',
]

export interface BlockingPosition {
  contactId: number
  zone: StageZone
  notes?: string // "sits on bench", "crosses to SL during speech"
}

export interface BlockingEntry {
  id?: number
  productionId: number
  /** Script page reference — matches tracking page field. */
  page: string
  /** Stable ordering across the whole show. Lower = earlier. */
  sequence: number
  /** Scene label for context — "Act 2, Scene 1", "Top of show", etc. */
  sceneLabel?: string
  /** All actor positions at this moment/page. */
  positions: BlockingPosition[]
  /** General blocking note for this page. */
  notes?: string
}

// ─── Equity break calculator ───────────────────────────────────────────────
//
// AEA rules enforced:
//   • 5-after-55: 5-minute break required after 55 minutes of continuous work
//   • 10-out-of-12: In a 12-hour tech day, only 10 hours can be work
//   • Meal within 5: Meal break must be called within 5 hours of initial call
//
// The BreakLog stores the day's event timeline so the SM can prove compliance
// after the fact if a grievance is filed.

export type BreakEventType = 'break-start' | 'break-end' | 'meal-start' | 'meal-end' | 'wrap'

export interface BreakEvent {
  type: BreakEventType
  time: string // "HH:MM" format
  note?: string
}

export interface BreakLog {
  id?: number
  productionId: number
  /** ISO date — one log per day. */
  date: string
  /** '10-of-12' enables the 10/12-specific hour tracking rules. */
  dayType: '10-of-12' | 'regular'
  /** When rehearsal was called — "09:00". */
  callTime: string
  /** Ordered timeline of break/meal events for the day. */
  events: BreakEvent[]
}

/** Key-value settings table — currently holds the auto-backup directory
 *  handle (a FileSystemDirectoryHandle is structured-clonable, so it
 *  persists across reloads). Keep keys namespaced like 'autoBackup:dir'. */
export interface SettingsEntry {
  key: string
  value: unknown
}

class StandbyDB extends Dexie {
  productions!: EntityTable<Production, 'id'>
  contacts!: EntityTable<Contact, 'id'>
  contactGroups!: EntityTable<ContactGroup, 'id'>
  props!: EntityTable<Prop, 'id'>
  lineNotes!: EntityTable<LineNote, 'id'>
  rehearsals!: EntityTable<RehearsalReport, 'id'>
  sendLog!: EntityTable<SendLogEntry, 'id'>
  settings!: EntityTable<SettingsEntry, 'key'>
  dailyCalls!: EntityTable<DailyCall, 'id'>
  tracking!: EntityTable<TrackingEntry, 'id'>
  blocking!: EntityTable<BlockingEntry, 'id'>
  breakLogs!: EntityTable<BreakLog, 'id'>

  constructor() {
    super('standby')
    this.version(1).stores({
      productions: '++id, name',
      contacts: '++id, productionId, category, name',
      contactGroups: '++id, productionId, name',
      props: '++id, productionId, name, status',
      lineNotes: '++id, productionId, rehearsalDate, characterId, delivered',
      rehearsals: '++id, productionId, date, dayNumber',
      sendLog: '++id, productionId, sentAt, artifact',
    })
    this.version(2).stores({
      productions: '++id, name',
      contacts: '++id, productionId, category, name',
      contactGroups: '++id, productionId, name',
      props: '++id, productionId, name, status',
      lineNotes: '++id, productionId, rehearsalDate, characterId, delivered',
      rehearsals: '++id, productionId, date, dayNumber',
      sendLog: '++id, productionId, sentAt, artifact',
      settings: '&key',
    })
    this.version(3).stores({
      productions: '++id, name',
      contacts: '++id, productionId, category, name',
      contactGroups: '++id, productionId, name',
      props: '++id, productionId, name, status',
      lineNotes: '++id, productionId, rehearsalDate, characterId, delivered',
      rehearsals: '++id, productionId, date, dayNumber',
      sendLog: '++id, productionId, sentAt, artifact',
      settings: '&key',
      dailyCalls: '++id, productionId, date, version',
    })
    // v4: adds tracking.
    this.version(4).stores({
      productions: '++id, name',
      contacts: '++id, productionId, category, name',
      contactGroups: '++id, productionId, name',
      props: '++id, productionId, name, status',
      lineNotes: '++id, productionId, rehearsalDate, characterId, delivered',
      rehearsals: '++id, productionId, date, dayNumber',
      sendLog: '++id, productionId, sentAt, artifact',
      settings: '&key',
      dailyCalls: '++id, productionId, date, version',
      tracking: '++id, productionId, sequence, page, kind',
    })
    // v5: adds blocking + breakLogs.
    this.version(5).stores({
      productions: '++id, name',
      contacts: '++id, productionId, category, name',
      contactGroups: '++id, productionId, name',
      props: '++id, productionId, name, status',
      lineNotes: '++id, productionId, rehearsalDate, characterId, delivered',
      rehearsals: '++id, productionId, date, dayNumber',
      sendLog: '++id, productionId, sentAt, artifact',
      settings: '&key',
      dailyCalls: '++id, productionId, date, version',
      tracking: '++id, productionId, sequence, page, kind',
      blocking: '++id, productionId, sequence, page',
      breakLogs: '++id, productionId, date',
    })
  }
}

export const db = new StandbyDB()

/**
 * Delete a production and all entities scoped to it.
 */
export async function deleteProductionCascade(productionId: number): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.productions,
      db.contacts,
      db.contactGroups,
      db.props,
      db.lineNotes,
      db.rehearsals,
      db.sendLog,
      db.dailyCalls,
      db.tracking,
      db.blocking,
      db.breakLogs,
    ],
    async () => {
      await db.contacts.where('productionId').equals(productionId).delete()
      await db.contactGroups.where('productionId').equals(productionId).delete()
      await db.props.where('productionId').equals(productionId).delete()
      await db.lineNotes.where('productionId').equals(productionId).delete()
      await db.rehearsals.where('productionId').equals(productionId).delete()
      await db.sendLog.where('productionId').equals(productionId).delete()
      await db.dailyCalls.where('productionId').equals(productionId).delete()
      await db.tracking.where('productionId').equals(productionId).delete()
      await db.blocking.where('productionId').equals(productionId).delete()
      await db.breakLogs.where('productionId').equals(productionId).delete()
      await db.productions.delete(productionId)
    },
  )
}
