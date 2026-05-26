import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
} from '@/components/Form'
import { db, type Contact, type TrackingEntry } from '@/lib/db'
import {
  COMMON_TRACKING_WHATS,
  COMMON_TRACKING_WHERES,
  TRACKING_KIND_LABELS,
  trackingEntryInputSchema,
  type TrackingEntryInput,
  type TrackingEntryKind,
} from '@/lib/schemas'

const TRACKING_KINDS: TrackingEntryKind[] = ['entry', 'scene-shift', 'crew']

interface Props {
  productionId: number
  entry?: TrackingEntry
  contacts: Contact[]
  defaultSequence: number
  defaultPage?: string
  defaultWhere?: string
  /** Quick-add mode: form clears and stays open after save, carrying forward
   *  page + where from the just-saved entry. */
  quickAdd?: boolean
  onSaved?: (saved: TrackingEntry) => void
  onCancel?: () => void
}

export default function TrackingEntryForm({
  productionId,
  entry,
  contacts,
  defaultSequence,
  defaultPage,
  defaultWhere,
  quickAdd,
  onSaved,
  onCancel,
}: Props) {
  const defaultValues: TrackingEntryInput = entry
    ? {
        sequence: entry.sequence,
        page: entry.page,
        kind: entry.kind,
        contactIds: entry.contactIds,
        whoOverride: entry.whoOverride ?? '',
        what: entry.what,
        where: entry.where,
        sceneLabel: entry.sceneLabel ?? '',
        notes: entry.notes ?? '',
      }
    : {
        sequence: defaultSequence,
        page: defaultPage ?? '',
        kind: 'entry',
        contactIds: [],
        whoOverride: '',
        what: '',
        where: defaultWhere ?? '',
        sceneLabel: '',
        notes: '',
      }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TrackingEntryInput>({
    resolver: zodResolver(trackingEntryInputSchema),
    defaultValues,
  })

  const kind = watch('kind')
  const contactIds = watch('contactIds')

  function toggleContact(contactId: number) {
    const next = contactIds.includes(contactId)
      ? contactIds.filter((id) => id !== contactId)
      : [...contactIds, contactId]
    setValue('contactIds', next, { shouldDirty: true })
  }

  const onSubmit = async (data: TrackingEntryInput) => {
    const payload: Omit<TrackingEntry, 'id'> = {
      productionId,
      sequence: data.sequence,
      page: data.page,
      kind: data.kind,
      contactIds: data.contactIds,
      whoOverride: data.whoOverride || undefined,
      what: data.what,
      where: data.where,
      sceneLabel: data.sceneLabel || undefined,
      notes: data.notes || undefined,
    }

    let saved: TrackingEntry
    if (entry?.id !== undefined) {
      await db.tracking.update(entry.id, payload)
      saved = { ...payload, id: entry.id } as TrackingEntry
    } else {
      const id = await db.tracking.add(payload as TrackingEntry)
      saved = { ...payload, id } as TrackingEntry
    }

    if (quickAdd && !entry) {
      reset({
        sequence: data.sequence + 10,
        page: data.page,
        kind: 'entry',
        contactIds: [],
        whoOverride: '',
        what: '',
        where: data.where,
        sceneLabel: '',
        notes: '',
      })
    }

    onSaved?.(saved)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[6rem_1fr_6rem]">
        <Field label="Sequence" error={errors.sequence?.message}>
          <Input
            {...register('sequence', { valueAsNumber: true })}
            type="number"
            min="0"
            step="10"
          />
        </Field>
        <Field label="Kind">
          <Select {...register('kind')}>
            {TRACKING_KINDS.map((k) => (
              <option key={k} value={k}>
                {TRACKING_KIND_LABELS[k]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Page">
          <Input {...register('page')} placeholder="e.g. 12" />
        </Field>
      </div>

      {kind === 'scene-shift' && (
        <Field label="Scene label" optional>
          <Input
            {...register('sceneLabel')}
            placeholder="e.g. SCENE SHIFT, Act 2 — top"
          />
        </Field>
      )}

      {kind !== 'scene-shift' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="What">
              <Input
                {...register('what')}
                placeholder="ENT, EXT, EXT/ENT, grab coin pouch…"
                list="tracking-whats"
              />
              <datalist id="tracking-whats">
                {COMMON_TRACKING_WHATS.map((w) => (
                  <option key={w} value={w} />
                ))}
              </datalist>
            </Field>
            <Field label="Where">
              <Input
                {...register('where')}
                placeholder="RW, LW, LCAP, ARB…"
                list="tracking-wheres"
              />
              <datalist id="tracking-wheres">
                {COMMON_TRACKING_WHERES.map((w) => (
                  <option key={w} value={w} />
                ))}
              </datalist>
            </Field>
          </div>

          <Field label="Who (cast / crew involved)">
            {contacts.length === 0 ? (
              <p className="rounded border border-dashed border-surface-border p-3 text-xs text-muted">
                Add contacts first — they'll appear here as checkboxes.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-1 rounded border border-surface-border p-2 sm:grid-cols-3 lg:grid-cols-4">
                {contacts.map((c) => {
                  if (c.id === undefined) return null
                  const checked = contactIds.includes(c.id)
                  return (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleContact(c.id!)}
                        className="h-3.5 w-3.5"
                      />
                      <span>{c.name}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </Field>

          <Field
            label="Who override"
            optional
            hint="Used when the who isn't a tracked contact — e.g. CREW, ENSEMBLE."
          >
            <Input
              {...register('whoOverride')}
              placeholder="e.g. CREW, Ensemble"
            />
          </Field>
        </>
      )}

      <Field label="Notes" optional>
        <Textarea
          {...register('notes')}
          rows={2}
          placeholder="e.g. comes off momentarily with coin pouch & hands to crew"
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {entry ? 'Save changes' : quickAdd ? 'Save & next ↵' : 'Add tracking entry'}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {quickAdd && !entry && (
          <span className="text-xs text-muted">
            Quick-add: form clears after save, carrying page + where forward
          </span>
        )}
      </div>
    </form>
  )
}
