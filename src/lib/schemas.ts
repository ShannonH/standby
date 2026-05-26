import { z } from 'zod'

export const productionTypeSchema = z.enum([
  'play',
  'musical',
  'devised',
  'cabaret',
  'other',
])

export const productionInputSchema = z.object({
  name: z.string().min(1, 'Production name is required'),
  workingTitle: z.string().optional(),
  season: z.string().optional(),
  type: productionTypeSchema,
  organization: z.string().optional(),
  venue: z.string().optional(),
  firstRehearsal: z.string().optional(),
  designerRun: z.string().optional(),
  techStart: z.string().optional(),
  firstPreview: z.string().optional(),
  opening: z.string().optional(),
  closing: z.string().optional(),
  equityMode: z.boolean().optional(),
})

export type ProductionInput = z.infer<typeof productionInputSchema>

export const contactCategorySchema = z.enum([
  'cast',
  'creative',
  'production',
  'crew',
  'venue-admin',
])

export const contactInputSchema = z.object({
  category: contactCategorySchema,
  name: z.string().min(1, 'Name is required'),
  role: z.string().optional(),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string().optional(),
  pronouns: z.string().optional(),
  emergencyContact: z.string().optional(),
  allergiesMedical: z.string().optional(),
  notes: z.string().optional(),
  doNotPublish: z.boolean().optional(),
})

export type ContactInput = z.infer<typeof contactInputSchema>

export const contactGroupInputSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  contactIds: z.array(z.number()),
})

export type ContactGroupInput = z.infer<typeof contactGroupInputSchema>

// ─── Rehearsal report ──────────────────────────────────────────────────────

export const attendanceStatusSchema = z.enum([
  'present',
  'late',
  'absent',
  'excused',
])

export const attendanceEntrySchema = z.object({
  contactId: z.number(),
  status: attendanceStatusSchema,
  minutesLate: z.number().int().nonnegative().optional(),
})

export const timeBlockSchema = z.object({
  start: z.string(),
  end: z.string(),
  activity: z.string(),
})

export const deptNoteSchema = z.object({
  text: z.string(),
  resolved: z.boolean().optional(),
})

export const rehearsalNotesSchema = z.object({
  scenic: z.array(deptNoteSchema),
  costumes: z.array(deptNoteSchema),
  wigsMakeup: z.array(deptNoteSchema),
  props: z.array(deptNoteSchema),
  lighting: z.array(deptNoteSchema),
  sound: z.array(deptNoteSchema),
  projections: z.array(deptNoteSchema),
  music: z.array(deptNoteSchema),
  production: z.array(deptNoteSchema),
})

export const rehearsalReportInputSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  dayNumber: z.coerce.number().int().min(1, 'Day number must be at least 1'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  location: z.string().optional(),
  attendance: z.array(attendanceEntrySchema),
  timeBlocks: z.array(timeBlockSchema),
  notes: rehearsalNotesSchema,
})

export type RehearsalReportInput = z.infer<typeof rehearsalReportInputSchema>

/** Display labels for the 9 departmental note sections, in the canonical
 *  order shown on Stern/Gold-conformant rehearsal reports. */
export const NOTE_DEPT_LABELS = [
  { key: 'scenic', label: 'Scenic' },
  { key: 'costumes', label: 'Costumes' },
  { key: 'wigsMakeup', label: 'Wigs & Makeup' },
  { key: 'props', label: 'Props' },
  { key: 'lighting', label: 'Lighting' },
  { key: 'sound', label: 'Sound' },
  { key: 'projections', label: 'Projections / Video' },
  { key: 'music', label: 'Music' },
  { key: 'production', label: 'Production / Admin' },
] as const

// ─── Line notes ────────────────────────────────────────────────────────────

export const lineTypeSchema = z.enum([
  'paraphrase',
  'drop',
  'add',
  'jump',
  'missed-cue',
  'call-line',
])

export type LineType = z.infer<typeof lineTypeSchema>

export const LINE_TYPE_LABELS: Record<LineType, string> = {
  paraphrase: 'Paraphrase',
  drop: 'Dropped line',
  add: 'Added line',
  jump: 'Jumped',
  'missed-cue': 'Missed cue',
  'call-line': 'Called line',
}

/** Order line types in the way SMs typically prioritize them. */
export const LINE_TYPE_ORDER: LineType[] = [
  'paraphrase',
  'drop',
  'add',
  'jump',
  'missed-cue',
  'call-line',
]

export const lineNoteInputSchema = z.object({
  rehearsalDate: z.string().min(1, 'Date is required'),
  page: z.string(),
  characterId: z.coerce.number().int().positive('Pick a cast member'),
  lineType: lineTypeSchema,
  scriptedText: z.string(),
  spokenText: z.string(),
  comment: z.string().optional(),
})

export type LineNoteInput = z.infer<typeof lineNoteInputSchema>

// ─── Props ────────────────────────────────────────────────────────────────

export const propSourceSchema = z.enum([
  'rental',
  'build',
  'buy',
  'pulled',
  'actor-personal',
  'unknown',
])

export type PropSource = z.infer<typeof propSourceSchema>

export const PROP_SOURCE_LABELS: Record<PropSource, string> = {
  rental: 'Rental',
  build: 'Build',
  buy: 'Buy',
  pulled: 'Pulled from stock',
  'actor-personal': 'Actor personal',
  unknown: 'Unknown',
}

export const propStatusSchema = z.enum([
  'needed',
  'sourced',
  'in-rehearsal',
  'built',
  'lost-replace',
])

export type PropStatus = z.infer<typeof propStatusSchema>

export const PROP_STATUS_LABELS: Record<PropStatus, string> = {
  needed: 'Needed',
  sourced: 'Sourced',
  'in-rehearsal': 'In rehearsal',
  built: 'Built',
  'lost-replace': 'Lost — replace',
}

export const propSpecialHandlingSchema = z.enum([
  'food',
  'weapons',
  'fire',
  'breakaway',
  'fragile',
  'liquid',
])

export type PropSpecialHandling = z.infer<typeof propSpecialHandlingSchema>

export const PROP_SPECIAL_HANDLING_LABELS: Record<
  PropSpecialHandling,
  string
> = {
  food: 'Food',
  weapons: 'Weapons',
  fire: 'Fire',
  breakaway: 'Breakaway',
  fragile: 'Fragile',
  liquid: 'Liquid',
}

export const PROP_SPECIAL_HANDLING_VALUES = [
  'food',
  'weapons',
  'fire',
  'breakaway',
  'fragile',
  'liquid',
] as const

// ─── Daily call ────────────────────────────────────────────────────────────

export const scheduleCalledModeSchema = z.enum([
  'all',
  'company',
  'specific',
  'custom',
])

export type ScheduleCalledMode = z.infer<typeof scheduleCalledModeSchema>

export const SCHEDULE_CALLED_MODE_LABELS: Record<ScheduleCalledMode, string> = {
  all: 'All called',
  company: 'Full company',
  specific: 'Specific cast',
  custom: 'Custom text',
}

export const dailyCallNoteSchema = z.object({
  text: z.string(),
})

export const dailyCallTimeSchema = z.object({
  contactId: z.number().int().positive(),
  time: z.string(),
})

export const scheduleItemSchema = z.object({
  time: z.string().min(1, 'Time is required'),
  activity: z.string().min(1, 'Activity is required'),
  description: z.string().optional(),
  calledMode: scheduleCalledModeSchema,
  calledContactIds: z.array(z.number().int().positive()),
  customLabel: z.string().optional(),
})

export const dailyCallInputSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  location: z.string().min(1, 'Location is required'),
  version: z.coerce.number().int().min(1, 'Version must be at least 1'),
  notes: z.array(dailyCallNoteSchema),
  callTimes: z.array(dailyCallTimeSchema),
  scheduleItems: z.array(scheduleItemSchema),
})

export type DailyCallInput = z.infer<typeof dailyCallInputSchema>

// ─── Master tracking ───────────────────────────────────────────────────────

export const trackingEntryKindSchema = z.enum([
  'entry',
  'scene-shift',
  'crew',
])

export type TrackingEntryKind = z.infer<typeof trackingEntryKindSchema>

export const TRACKING_KIND_LABELS: Record<TrackingEntryKind, string> = {
  entry: 'Entry',
  'scene-shift': 'Scene shift',
  crew: 'Crew action',
}

/** Common "WHAT" values offered as auto-complete suggestions; user can type
 *  any string they want. */
export const COMMON_TRACKING_WHATS = [
  'ENT',
  'EXT',
  'ENT/EXT',
  'EXT/ENT',
  'CROSS',
  'SET',
  'STRIKE',
  'GRAB',
  'HAND-OFF',
] as const

/** Common "WHERE" values offered as auto-complete suggestions; user can type
 *  any string they want. Different houses use different position codes. */
export const COMMON_TRACKING_WHERES = [
  'SR',
  'SL',
  'CS',
  'RW',
  'LW',
  'CW',
  'USR',
  'USL',
  'DSR',
  'DSL',
  'LCAP',
  'RCAP',
  'CD',
  'ARB',
  'CD',
  'RA',
  'LA',
] as const

export const trackingEntryInputSchema = z.object({
  sequence: z.coerce.number().int().nonnegative(),
  page: z.string(),
  kind: trackingEntryKindSchema,
  contactIds: z.array(z.number().int().positive()),
  whoOverride: z.string().optional(),
  what: z.string(),
  where: z.string(),
  sceneLabel: z.string().optional(),
  notes: z.string().optional(),
})

export type TrackingEntryInput = z.infer<typeof trackingEntryInputSchema>

/**
 * Form-shaped schema for the prop editor. scenes/characters use a comma-
 * separated string for ergonomic typing; specialHandling expands to one
 * boolean per tag for easy checkbox rendering. The form-to-DB conversion
 * happens in PropForm itself.
 */
export const propFormSchema = z.object({
  name: z.string().min(1, 'Prop name is required'),
  scenesText: z.string(),
  charactersText: z.string(),
  consumable: z.boolean(),
  source: propSourceSchema,
  status: propStatusSchema,
  tableLocation: z.string().optional(),
  food: z.boolean(),
  weapons: z.boolean(),
  fire: z.boolean(),
  breakaway: z.boolean(),
  fragile: z.boolean(),
  liquid: z.boolean(),
  notes: z.string().optional(),
})

export type PropFormInput = z.infer<typeof propFormSchema>

// ─── Show report ───────────────────────────────────────────────────────────

export const incidentKindSchema = z.enum([
  'medical',
  'audience',
  'technical',
  'safety',
  'other',
])

export type IncidentKind = z.infer<typeof incidentKindSchema>

export const INCIDENT_KIND_LABELS: Record<IncidentKind, string> = {
  medical: 'Medical',
  audience: 'Audience',
  technical: 'Technical',
  safety: 'Safety',
  other: 'Other',
}

export const actTimeSchema = z.object({
  label: z.string().min(1, 'Act label required'),
  start: z.string(),
  end: z.string(),
})

export const intermissionTimeSchema = z.object({
  label: z.string().optional(),
  start: z.string(),
  end: z.string(),
})

export const holdEventSchema = z.object({
  when: z.string().min(1, 'When did the hold happen?'),
  durationMinutes: z.coerce.number().int().nonnegative(),
  reason: z.string().min(1, 'Reason required'),
})

export const incidentSchema = z.object({
  kind: incidentKindSchema,
  description: z.string().min(1, 'Description required'),
})

export const understudyChangeSchema = z.object({
  contactId: z.coerce.number().int().positive('Pick a cast member'),
  role: z.string().min(1, 'Role required'),
  reason: z.string().optional(),
})

export const showReportInputSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  performanceNumber: z.coerce
    .number()
    .int()
    .min(1, 'Performance number must be at least 1'),
  performanceLabel: z.string().min(1, 'Label required'),
  location: z.string().optional(),
  curtainUp: z.string().min(1, 'Curtain time required'),
  curtainDown: z.string().optional(),
  houseCount: z.coerce.number().int().nonnegative().optional(),
  lateSeating: z.coerce.number().int().nonnegative().optional(),
  acts: z.array(actTimeSchema),
  intermissions: z.array(intermissionTimeSchema),
  holds: z.array(holdEventSchema),
  incidents: z.array(incidentSchema),
  understudyChanges: z.array(understudyChangeSchema),
  notes: rehearsalNotesSchema,
})

export type ShowReportInput = z.infer<typeof showReportInputSchema>

// ─── Scene / character breakdown (V2) ───────────────────────────────────

export const characterTypeSchema = z.enum([
  'principal',
  'featured',
  'ensemble',
  'voice',
  'silent',
])

export const CHARACTER_TYPE_LABELS: Record<
  z.infer<typeof characterTypeSchema>,
  string
> = {
  principal: 'Principal',
  featured: 'Featured',
  ensemble: 'Ensemble',
  voice: 'Voice (offstage)',
  silent: 'Silent / extra',
}

export const characterInputSchema = z.object({
  name: z.string().min(1, 'Character name required'),
  type: characterTypeSchema.optional(),
  playedByContactId: z.coerce.number().int().positive().optional(),
  notes: z.string().optional(),
})

export type CharacterInput = z.infer<typeof characterInputSchema>

export const sceneInputSchema = z.object({
  sequence: z.coerce.number().int().min(1),
  label: z.string().min(1, 'Scene label required'),
  act: z.string().optional(),
  numberName: z.string().optional(),
  pageStart: z.string().optional(),
  pageEnd: z.string().optional(),
  location: z.string().optional(),
  runningTimeMin: z.coerce.number().int().nonnegative().optional(),
  notes: z.string().optional(),
})

export type SceneInput = z.infer<typeof sceneInputSchema>

export const appearanceTypeSchema = z.enum([
  'speaking',
  'singing',
  'silent',
  'underscoring',
])

export const APPEARANCE_TYPE_LABELS: Record<
  z.infer<typeof appearanceTypeSchema>,
  string
> = {
  speaking: 'Speaking',
  singing: 'Singing',
  silent: 'Silent on stage',
  underscoring: 'Underscoring / voice only',
}

/** Single-character glyph used to render presence in the matrix grid.
 *  Chosen to scan at a glance: filled dot for speaking (the most common
 *  presence), musical note for singing, hollow dot for silent, tilde
 *  for underscoring. */
export const APPEARANCE_TYPE_GLYPHS: Record<
  z.infer<typeof appearanceTypeSchema>,
  string
> = {
  speaking: '●',
  singing: '♪',
  silent: '○',
  underscoring: '~',
}

export const sceneAppearanceInputSchema = z.object({
  sceneId: z.coerce.number().int().positive(),
  characterId: z.coerce.number().int().positive(),
  entrancePage: z.string().optional(),
  exitPage: z.string().optional(),
  presence: appearanceTypeSchema,
  doubling: z.string().optional(),
})

export type SceneAppearanceInput = z.infer<typeof sceneAppearanceInputSchema>
