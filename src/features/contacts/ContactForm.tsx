import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Checkbox,
  Field,
  Input,
  Select,
  Textarea,
} from '@/components/Form'
import { db, type Contact } from '@/lib/db'
import { maybePublishContactSheet } from '@/lib/publish'
import { contactInputSchema, type ContactInput } from '@/lib/schemas'

interface Props {
  productionId: number
  contact?: Contact
  onSaved?: () => void
  onCancel?: () => void
}

export default function ContactForm({
  productionId,
  contact,
  onSaved,
  onCancel,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactInputSchema),
    defaultValues: contact
      ? {
          category: contact.category,
          name: contact.name,
          role: contact.role ?? '',
          email: contact.email ?? '',
          phone: contact.phone ?? '',
          pronouns: contact.pronouns ?? '',
          emergencyContact: contact.emergencyContact ?? '',
          allergiesMedical: contact.allergiesMedical ?? '',
          notes: contact.notes ?? '',
          doNotPublish: contact.doNotPublish ?? false,
        }
      : {
          category: 'cast',
          name: '',
          doNotPublish: false,
        },
  })

  const onSubmit = async (data: ContactInput) => {
    const payload: Omit<Contact, 'id'> = {
      productionId,
      category: data.category,
      name: data.name,
      role: data.role || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      pronouns: data.pronouns || undefined,
      emergencyContact: data.emergencyContact || undefined,
      allergiesMedical: data.allergiesMedical || undefined,
      notes: data.notes || undefined,
      doNotPublish: data.doNotPublish || undefined,
    }
    if (contact?.id !== undefined) {
      await db.contacts.update(contact.id, payload)
    } else {
      await db.contacts.add(payload as Contact)
    }
    void maybePublishContactSheet(productionId)
    onSaved?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" required>
          <Select {...register('category')}>
            <option value="cast">Cast</option>
            <option value="creative">Creative Team</option>
            <option value="production">Production Team</option>
            <option value="crew">Crew</option>
            <option value="venue-admin">Venue / Admin</option>
          </Select>
        </Field>
        <Field label="Name" required error={errors.name?.message}>
          <Input {...register('name')} placeholder="Jane Doe" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Role / Character" optional>
          <Input
            {...register('role')}
            placeholder="e.g. Cinderella, Lighting Designer"
          />
        </Field>
        <Field label="Pronouns" optional>
          <Input {...register('pronouns')} placeholder="she/her" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" optional error={errors.email?.message}>
          <Input {...register('email')} type="email" />
        </Field>
        <Field label="Phone" optional>
          <Input {...register('phone')} type="tel" />
        </Field>
      </div>

      <Field
        label="Emergency contact"
        optional
        hint="Private — never appears in the published contact sheet."
      >
        <Input
          {...register('emergencyContact')}
          placeholder="e.g. Alex Doe — 555-867-5309 — parent"
        />
      </Field>

      <Field
        label="Allergies / medical"
        optional
        hint="Private — never appears in the published contact sheet."
      >
        <Input
          {...register('allergiesMedical')}
          placeholder="e.g. Peanut allergy"
        />
      </Field>

      <Field label="Notes" optional>
        <Textarea {...register('notes')} rows={2} />
      </Field>

      <Checkbox
        {...register('doNotPublish')}
        label="Do not include in the published contact sheet (e.g. private contact, withheld at request)"
      />

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {contact ? 'Save changes' : 'Add contact'}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
