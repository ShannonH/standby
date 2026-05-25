import Dexie, { type EntityTable } from 'dexie'

// Schema mirrors PRD §8 data model. Keep in sync with docs/PRD.md.

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
  name: string
  description?: string
  contactIds: number[]
}

export interface Prop {
  id?: number
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
  rehearsalDate: string
  page: string
  characterId: number
  lineType: 'paraphrase' | 'drop' | 'add' | 'jump' | 'missed-cue' | 'call-line'
  scriptedText: string
  spokenText: string
  comment?: string
  delivered?: boolean
}

export interface RehearsalReport {
  id?: number
  date: string
  dayNumber: number
  startTime: string
  endTime: string
  location?: string
  attendance: Array<{
    contactId: number
    status: 'present' | 'late' | 'absent' | 'excused'
    minutesLate?: number
  }>
  timeBlocks: Array<{ start: string; end: string; activity: string }>
  notes: {
    scenic: string[]
    costumes: string[]
    wigsMakeup: string[]
    props: string[]
    lighting: string[]
    sound: string[]
    projections: string[]
    music: string[]
    production: string[]
  }
}

export interface SendLogEntry {
  id?: number
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
      contacts: '++id, category, name',
      contactGroups: '++id, name',
      props: '++id, name, status',
      lineNotes: '++id, rehearsalDate, characterId, delivered',
      rehearsals: '++id, date, dayNumber',
      sendLog: '++id, sentAt, artifact',
    })
  }
}

export const db = new StandbyDB()
