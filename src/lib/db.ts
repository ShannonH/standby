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
  specialHandling?: string[]
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

class StandbyDB extends Dexie {
  productions!: EntityTable<Production, 'id'>
  contacts!: EntityTable<Contact, 'id'>
  contactGroups!: EntityTable<ContactGroup, 'id'>
  props!: EntityTable<Prop, 'id'>
  lineNotes!: EntityTable<LineNote, 'id'>
  rehearsals!: EntityTable<RehearsalReport, 'id'>
  sendLog!: EntityTable<SendLogEntry, 'id'>

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
    ],
    async () => {
      await db.contacts.where('productionId').equals(productionId).delete()
      await db.contactGroups.where('productionId').equals(productionId).delete()
      await db.props.where('productionId').equals(productionId).delete()
      await db.lineNotes.where('productionId').equals(productionId).delete()
      await db.rehearsals.where('productionId').equals(productionId).delete()
      await db.sendLog.where('productionId').equals(productionId).delete()
      await db.productions.delete(productionId)
    },
  )
}
