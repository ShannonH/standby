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
