import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Field, Input, Select } from '@/components/Form'
import { db, type Contact, type DailyCall } from '@/lib/db'
import { maybePublishDailyCall } from '@/lib/publish'
import {
  dailyCallInputSchema,
  SCHEDULE_CALLED_MODE_LABELS,
  type DailyCallInput,
  type ScheduleCalledMode,
} from '@/lib/schemas'

interface Props {
  productionId: number
  call?: DailyCall
  cast: Contact[]
  defaultVersion: number
  /** Used as the default time when adding new cast to the call-times list. */
  defaultTime?: string
  /** Used to pre-fill the date for new calls. */
  defaultDate: string
  /** Used to pre-fill the location for new calls (carries last value forward). */
  defaultLocation?: string
  onSaved?: () => void
  onCancel?: () => void
}

const CALLED_MODES: ScheduleCalledMode[] = [
  'all',
  'company',
  'specific',
  'custom',
]

export default function DailyCallForm({
  productionId,
  call,
  cast,
  defaultVersion,
  defaultTime = '10:00',
  defaultDate,
  defaultLocation,
  onSaved,
  onCancel,
}: Props) {
  const defaultValues: DailyCallInput = call
    ? {
        date: call.date,
        location: call.location,
        version: call.version,
        notes: call.notes,
        callTimes: call.callTimes,
        scheduleItems: call.scheduleItems,
      }
    : {
        date: defaultDate,
        location: defaultLocation ?? '',
        version: defaultVersion,
        notes: [],
        callTimes: cast
          .filter((c) => c.id !== undefined)
          .map((c) => ({ contactId: c.id!, time: defaultTime })),
        scheduleItems: [],
      }

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DailyCallInput>({
    resolver: zodResolver(dailyCallInputSchema),
    defaultValues,
  })

  const notes = useFieldArray({ control, name: 'notes' })
  const callTimes = useFieldArray({ control, name: 'callTimes' })
  const scheduleItems = useFieldArray({ control, name: 'scheduleItems' })

  function contactName(contactId: number): string {
    return cast.find((c) => c.id === contactId)?.name ?? '(unknown)'
  }

  function applyDefaultTimeToAll() {
    const t = window.prompt(
      'Set this time for every cast member:',
      defaultTime,
    )
    if (!t) return
    callTimes.fields.forEach((_, i) => {
      setValue(`callTimes.${i}.time`, t, { shouldDirty: true })
    })
  }

  const onSubmit = async (data: DailyCallInput) => {
    const payload: Omit<DailyCall, 'id'> = {
      productionId,
      date: data.date,
      location: data.location,
      version: data.version,
      notes: data.notes,
      callTimes: data.callTimes,
      scheduleItems: data.scheduleItems.map((si) => ({
        ...si,
        description: si.description || undefined,
        customLabel: si.customLabel || undefined,
      })),
    }
    let callId: number
    if (call?.id !== undefined) {
      await db.dailyCalls.update(call.id, payload)
      callId = call.id
    } else {
      callId = (await db.dailyCalls.add(payload as DailyCall)) as number
    }
    void maybePublishDailyCall(productionId, callId)
    onSaved?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      {/* Header */}
      <section>
        <h3 className="mb-3 font-display text-lg">Header</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Date" required error={errors.date?.message}>
            <Input {...register('date')} type="date" />
          </Field>
          <Field label="Location" required error={errors.location?.message}>
            <Input
              {...register('location')}
              placeholder="e.g. Battelle Dance Studio"
            />
          </Field>
          <Field label="Version" required error={errors.version?.message} hint="Bump for revisions on the same date.">
            <Input
              {...register('version', { valueAsNumber: true })}
              type="number"
              min="1"
            />
          </Field>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium">Notes</label>
            <Button
              variant="secondary"
              onClick={() => notes.append({ text: '' })}
            >
              + Add note
            </Button>
          </div>
          {notes.fields.length === 0 ? (
            <p className="rounded border border-dashed border-surface-border p-3 text-center text-xs text-muted">
              No notes. These appear in red below the header on the PDF — e.g.
              "Please come knowing all your solo lines."
            </p>
          ) : (
            <ul className="space-y-2">
              {notes.fields.map((field, idx) => (
                <li key={field.id} className="flex items-start gap-2">
                  <span className="mt-2 text-xs text-muted">{idx + 1}.</span>
                  <Input
                    {...register(`notes.${idx}.text`)}
                    placeholder="A short instruction or reminder"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => notes.remove(idx)}
                    aria-label="Remove note"
                  >
                    ×
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Call Times */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg">Call times</h3>
          <Button variant="secondary" onClick={applyDefaultTimeToAll}>
            Set all to the same time…
          </Button>
        </div>
        {callTimes.fields.length === 0 ? (
          <p className="rounded border border-dashed border-surface-border p-4 text-center text-sm text-muted">
            Add cast in Contacts first — they'll auto-populate here when you
            open a new call.
          </p>
        ) : (
          <ul className="divide-y divide-surface-border rounded border border-surface-border">
            {callTimes.fields.map((field, idx) => (
              <li key={field.id} className="flex items-center gap-3 p-2">
                <span className="flex-1 text-sm">
                  {contactName(field.contactId)}
                </span>
                <Input
                  {...register(`callTimes.${idx}.time`)}
                  type="time"
                  className="w-28"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Schedule */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg">Rehearsal schedule</h3>
          <Button
            variant="secondary"
            onClick={() =>
              scheduleItems.append({
                time: '',
                activity: '',
                description: '',
                calledMode: 'all',
                calledContactIds: [],
                customLabel: '',
              })
            }
          >
            + Add schedule item
          </Button>
        </div>
        {scheduleItems.fields.length === 0 ? (
          <p className="rounded border border-dashed border-surface-border p-4 text-center text-sm text-muted">
            No items yet. Add one per activity (read-through, blocking session,
            meal break, etc.).
          </p>
        ) : (
          <ul className="space-y-4">
            {scheduleItems.fields.map((field, idx) => (
              <ScheduleItemEditor
                key={field.id}
                idx={idx}
                control={control}
                register={register}
                watch={watch}
                setValue={setValue}
                cast={cast}
                onRemove={() => scheduleItems.remove(idx)}
                errors={errors}
              />
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-surface-border pt-6">
        <Button type="submit" disabled={isSubmitting}>
          {call ? 'Save changes' : 'Save daily call'}
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

interface ScheduleItemEditorProps {
  idx: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any
  cast: Contact[]
  onRemove: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any
}

function ScheduleItemEditor({
  idx,
  control,
  register,
  watch,
  setValue,
  cast,
  onRemove,
  errors,
}: ScheduleItemEditorProps) {
  const mode = watch(`scheduleItems.${idx}.calledMode`) as ScheduleCalledMode
  const calledIds = watch(`scheduleItems.${idx}.calledContactIds`) as number[]
  const itemErrors = errors?.scheduleItems?.[idx]

  function toggleContact(contactId: number) {
    const next = calledIds.includes(contactId)
      ? calledIds.filter((id) => id !== contactId)
      : [...calledIds, contactId]
    setValue(`scheduleItems.${idx}.calledContactIds`, next, {
      shouldDirty: true,
    })
  }

  return (
    <li className="space-y-3 rounded border border-surface-border p-3">
      <div className="grid gap-3 sm:grid-cols-[7rem_1fr_auto]">
        <Field label="Time" error={itemErrors?.time?.message}>
          <Input
            {...register(`scheduleItems.${idx}.time`)}
            placeholder="10:00a"
          />
        </Field>
        <Field label="Activity" error={itemErrors?.activity?.message}>
          <Input
            {...register(`scheduleItems.${idx}.activity`)}
            placeholder="e.g. Choreograph Romantic Atmosphere"
          />
        </Field>
        <div className="flex items-end">
          <Button variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>

      <Field label="Description (optional)">
        <Input
          {...register(`scheduleItems.${idx}.description`)}
          placeholder="e.g. - Ensemble, Bows, Requests, and Amalia's solos"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
        <Field label="Called">
          <Controller
            control={control}
            name={`scheduleItems.${idx}.calledMode`}
            render={({ field }) => (
              <Select {...field}>
                {CALLED_MODES.map((m) => (
                  <option key={m} value={m}>
                    {SCHEDULE_CALLED_MODE_LABELS[m]}
                  </option>
                ))}
              </Select>
            )}
          />
        </Field>

        {mode === 'custom' && (
          <Field label="Custom label">
            <Input
              {...register(`scheduleItems.${idx}.customLabel`)}
              placeholder="e.g. Music team only"
            />
          </Field>
        )}

        {mode === 'specific' && (
          <Field label="Who's called">
            <div className="grid grid-cols-2 gap-1 rounded border border-surface-border p-2 sm:grid-cols-3">
              {cast.map((c) => {
                if (c.id === undefined) return null
                const checked = calledIds.includes(c.id)
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
          </Field>
        )}
      </div>
    </li>
  )
}
