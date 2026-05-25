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
