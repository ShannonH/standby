import { useState } from 'react'
import {
  useFieldArray,
  useForm,
  type Control,
  type UseFormRegister,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Field, Input, Select, Textarea } from '@/components/Form'
import {
  db,
  emptyRehearsalNotes,
  type Contact,
  type NoteDeptKey,
  type ShowReport,
} from '@/lib/db'
import { maybePublishShowReport } from '@/lib/publish'
import {
  INCIDENT_KIND_LABELS,
  NOTE_DEPT_LABELS,
  showReportInputSchema,
  type ShowReportInput,
} from '@/lib/schemas'

interface Props {
  productionId: number
  report?: ShowReport
  cast: Contact[]
  defaultPerformanceNumber: number
  defaultLocation?: string
  defaultCurtainUp?: string
  onSaved?: () => void
  onCancel?: () => void
}

/**
 * Show report form. Run-of-show counterpart to the rehearsal report.
 *
 * Pre-fills sensible defaults for a typical opening-week show:
 * - performance number = max(prev) + 1
 * - one act, no intermission (musicals can add the second act manually)
 * - curtain inherited from previous report if available
 *
 * Department notes use the same 9-dept structure as rehearsal reports so
 * designers reply with the same "Re: Costumes #3" numbering convention.
 */
export default function ShowReportForm({
  productionId,
  report,
  cast,
  defaultPerformanceNumber,
  defaultLocation,
  defaultCurtainUp,
  onSaved,
  onCancel,
}: Props) {
  const defaultValues: ShowReportInput = report
    ? {
        date: report.date,
        performanceNumber: report.performanceNumber,
        performanceLabel: report.performanceLabel,
        location: report.location ?? '',
        curtainUp: report.curtainUp,
        curtainDown: report.curtainDown ?? '',
        houseCount: report.houseCount,
        lateSeating: report.lateSeating,
        acts: report.acts,
        intermissions: report.intermissions,
        holds: report.holds,
        incidents: report.incidents,
        understudyChanges: report.understudyChanges,
        notes: { ...emptyRehearsalNotes(), ...report.notes },
      }
    : {
        date: new Date().toISOString().slice(0, 10),
        performanceNumber: defaultPerformanceNumber,
        performanceLabel: `Performance ${defaultPerformanceNumber}`,
        location: defaultLocation ?? '',
        curtainUp: defaultCurtainUp ?? '19:30',
        curtainDown: '',
        houseCount: undefined,
        lateSeating: undefined,
        acts: [{ label: 'Act I', start: '', end: '' }],
        intermissions: [],
        holds: [],
        incidents: [],
        understudyChanges: [],
        notes: emptyRehearsalNotes(),
      }

  const form = useForm<ShowReportInput>({
    resolver: zodResolver(showReportInputSchema),
    defaultValues,
  })
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  const acts = useFieldArray({ control, name: 'acts' })
  const intermissions = useFieldArray({ control, name: 'intermissions' })
  const holds = useFieldArray({ control, name: 'holds' })
  const incidents = useFieldArray({ control, name: 'incidents' })
  const understudies = useFieldArray({ control, name: 'understudyChanges' })

  // Brief "Saved ✓" confirmation between db write and navigation — see
  // RehearsalReportForm for the same pattern.
  const [justSaved, setJustSaved] = useState(false)

  const onSubmit = async (data: ShowReportInput) => {
    const payload: Omit<ShowReport, 'id'> = {
      productionId,
      date: data.date,
      performanceNumber: data.performanceNumber,
      performanceLabel: data.performanceLabel,
      location: data.location || undefined,
      curtainUp: data.curtainUp,
      curtainDown: data.curtainDown || undefined,
      houseCount: data.houseCount,
      lateSeating: data.lateSeating,
      acts: data.acts,
      intermissions: data.intermissions,
      holds: data.holds,
      incidents: data.incidents,
      understudyChanges: data.understudyChanges,
      notes: data.notes,
    }
    let reportId: number
    if (report?.id !== undefined) {
      await db.showReports.update(report.id, payload)
      reportId = report.id
    } else {
      reportId = (await db.showReports.add(payload as ShowReport)) as number
    }
    void maybePublishShowReport(productionId, reportId)
    setJustSaved(true)
    window.setTimeout(() => onSaved?.(), 900)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      <section>
        <h3 className="mb-3 font-display text-lg">Header</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Date" required error={errors.date?.message}>
            <Input {...register('date')} type="date" />
          </Field>
          <Field label="Performance #" required error={errors.performanceNumber?.message}>
            <Input
              {...register('performanceNumber', { valueAsNumber: true })}
              type="number"
              min="1"
            />
          </Field>
          <Field label="Label" required error={errors.performanceLabel?.message}>
            <Input
              {...register('performanceLabel')}
              placeholder="e.g. Opening, Preview 2, Sunday matinee"
            />
          </Field>
          <Field label="Curtain up" required error={errors.curtainUp?.message}>
            <Input {...register('curtainUp')} type="time" />
          </Field>
          <Field label="Curtain down" optional>
            <Input {...register('curtainDown')} type="time" />
          </Field>
          <Field label="Location" optional>
            <Input {...register('location')} placeholder="e.g. Cowan Hall" />
          </Field>
          <Field label="House count" optional>
            <Input
              {...register('houseCount', {
                setValueAs: (v) =>
                  v === '' || v === null || v === undefined
                    ? undefined
                    : Number(v),
              })}
              type="number"
              min="0"
              placeholder="e.g. 247"
            />
          </Field>
          <Field label="Late seating" optional>
            <Input
              {...register('lateSeating', {
                setValueAs: (v) =>
                  v === '' || v === null || v === undefined
                    ? undefined
                    : Number(v),
              })}
              type="number"
              min="0"
              placeholder="# admitted late"
            />
          </Field>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg">Act run times</h3>
          <Button
            variant="secondary"
            onClick={() =>
              acts.append({
                label: `Act ${acts.fields.length + 1}`,
                start: '',
                end: '',
              })
            }
          >
            + Add act
          </Button>
        </div>
        {acts.fields.length === 0 ? (
          <p className="rounded border border-dashed border-surface-border p-4 text-center text-sm text-muted">
            No acts logged yet. Most shows have at least one — add it above.
          </p>
        ) : (
          <ul className="space-y-2">
            {acts.fields.map((field, idx) => (
              <li
                key={field.id}
                className="grid items-end gap-2 sm:grid-cols-[1fr_7rem_7rem_auto]"
              >
                <Field label={idx === 0 ? 'Label' : ''}>
                  <Input
                    {...register(`acts.${idx}.label`)}
                    placeholder="e.g. Act I"
                  />
                </Field>
                <Field label={idx === 0 ? 'Start' : ''}>
                  <Input {...register(`acts.${idx}.start`)} type="time" />
                </Field>
                <Field label={idx === 0 ? 'End' : ''}>
                  <Input {...register(`acts.${idx}.end`)} type="time" />
                </Field>
                <Button
                  variant="ghost"
                  onClick={() => acts.remove(idx)}
                  aria-label="Remove act"
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg">Intermissions</h3>
          <Button
            variant="secondary"
            onClick={() =>
              intermissions.append({
                label: `Intermission ${intermissions.fields.length + 1}`,
                start: '',
                end: '',
              })
            }
          >
            + Add intermission
          </Button>
        </div>
        {intermissions.fields.length === 0 ? (
          <p className="rounded border border-dashed border-surface-border p-4 text-center text-sm text-muted">
            No intermissions. Add one if the show has a break — Standby will
            compute total run including/excluding intermissions on the PDF.
          </p>
        ) : (
          <ul className="space-y-2">
            {intermissions.fields.map((field, idx) => (
              <li
                key={field.id}
                className="grid items-end gap-2 sm:grid-cols-[1fr_7rem_7rem_auto]"
              >
                <Field label={idx === 0 ? 'Label' : ''} optional>
                  <Input
                    {...register(`intermissions.${idx}.label`)}
                    placeholder="(auto-numbered)"
                  />
                </Field>
                <Field label={idx === 0 ? 'Start' : ''}>
                  <Input
                    {...register(`intermissions.${idx}.start`)}
                    type="time"
                  />
                </Field>
                <Field label={idx === 0 ? 'End' : ''}>
                  <Input
                    {...register(`intermissions.${idx}.end`)}
                    type="time"
                  />
                </Field>
                <Button
                  variant="ghost"
                  onClick={() => intermissions.remove(idx)}
                  aria-label="Remove intermission"
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg">Holds</h3>
          <Button
            variant="secondary"
            onClick={() =>
              holds.append({ when: '', durationMinutes: 0, reason: '' })
            }
          >
            + Add hold
          </Button>
        </div>
        <p className="mb-3 text-sm text-muted">
          Any time the show held — for a sick audience member, a flying-piece
          glitch, a long applause break, anything that ate clock time.
        </p>
        {holds.fields.length === 0 ? (
          <p className="rounded border border-dashed border-surface-border p-4 text-center text-sm text-muted">
            No holds logged. Smooth show.
          </p>
        ) : (
          <ul className="space-y-2">
            {holds.fields.map((field, idx) => (
              <li
                key={field.id}
                className="grid items-end gap-2 sm:grid-cols-[1fr_7rem_2fr_auto]"
              >
                <Field label={idx === 0 ? 'When' : ''}>
                  <Input
                    {...register(`holds.${idx}.when`)}
                    placeholder="e.g. Top of Act 2, mid-3.4"
                  />
                </Field>
                <Field label={idx === 0 ? 'Minutes' : ''}>
                  <Input
                    {...register(`holds.${idx}.durationMinutes`, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    min="0"
                  />
                </Field>
                <Field label={idx === 0 ? 'Reason' : ''}>
                  <Input
                    {...register(`holds.${idx}.reason`)}
                    placeholder="e.g. Audience medical"
                  />
                </Field>
                <Button
                  variant="ghost"
                  onClick={() => holds.remove(idx)}
                  aria-label="Remove hold"
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg">Incidents</h3>
          <Button
            variant="secondary"
            onClick={() => incidents.append({ kind: 'other', description: '' })}
          >
            + Add incident
          </Button>
        </div>
        <p className="mb-3 text-sm text-muted">
          Anything that needs follow-up — injuries, near-misses, tech failures,
          audience disturbances. Keep the description factual; the PDF carries
          this language verbatim into the producer/PSM inbox.
        </p>
        {incidents.fields.length === 0 ? (
          <p className="rounded border border-dashed border-surface-border p-4 text-center text-sm text-muted">
            No incidents.
          </p>
        ) : (
          <ul className="space-y-2">
            {incidents.fields.map((field, idx) => (
              <li
                key={field.id}
                className="grid items-end gap-2 sm:grid-cols-[10rem_1fr_auto]"
              >
                <Field label={idx === 0 ? 'Kind' : ''}>
                  <Select {...register(`incidents.${idx}.kind`)}>
                    {(
                      Object.entries(INCIDENT_KIND_LABELS) as [
                        keyof typeof INCIDENT_KIND_LABELS,
                        string,
                      ][]
                    ).map(([kind, label]) => (
                      <option key={kind} value={kind}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={idx === 0 ? 'Description' : ''}>
                  <Textarea
                    {...register(`incidents.${idx}.description`)}
                    rows={2}
                    placeholder="What happened, who responded, current status."
                  />
                </Field>
                <Button
                  variant="ghost"
                  onClick={() => incidents.remove(idx)}
                  aria-label="Remove incident"
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg">Understudy / swing changes</h3>
          <Button
            variant="secondary"
            onClick={() =>
              understudies.append({ contactId: 0, role: '', reason: '' })
            }
          >
            + Add change
          </Button>
        </div>
        {understudies.fields.length === 0 ? (
          <p className="rounded border border-dashed border-surface-border p-4 text-center text-sm text-muted">
            No understudy or swing changes tonight.
          </p>
        ) : (
          <ul className="space-y-2">
            {understudies.fields.map((field, idx) => (
              <li
                key={field.id}
                className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
              >
                <Field
                  label={idx === 0 ? 'Who went on' : ''}
                  error={errors.understudyChanges?.[idx]?.contactId?.message}
                >
                  <Select
                    {...register(`understudyChanges.${idx}.contactId`, {
                      valueAsNumber: true,
                    })}
                  >
                    <option value={0}>— Choose cast member —</option>
                    {cast.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={idx === 0 ? 'Role covered' : ''}>
                  <Input
                    {...register(`understudyChanges.${idx}.role`)}
                    placeholder="e.g. Mercutio"
                  />
                </Field>
                <Field label={idx === 0 ? 'Reason' : ''} optional>
                  <Input
                    {...register(`understudyChanges.${idx}.reason`)}
                    placeholder="illness, scheduled rotation, etc."
                  />
                </Field>
                <Button
                  variant="ghost"
                  onClick={() => understudies.remove(idx)}
                  aria-label="Remove change"
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-3 font-display text-lg">Departmental notes</h3>
        <p className="mb-4 text-sm text-muted">
          Notes per department, numbered automatically on export. Same 9-dept
          structure as the rehearsal report so designers reply with the same
          numbering convention.
        </p>
        <div className="space-y-3">
          {NOTE_DEPT_LABELS.map((dept) => (
            <DeptNotesSection
              key={dept.key}
              label={dept.label}
              deptKey={dept.key}
              control={control}
              register={register}
            />
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-surface-border pt-6">
        <Button type="submit" disabled={isSubmitting || justSaved}>
          {justSaved
            ? 'Saved ✓'
            : isSubmitting
              ? 'Saving…'
              : report
                ? 'Save changes'
                : 'Save show report'}
        </Button>
        {onCancel && !justSaved && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

interface DeptSectionProps {
  label: string
  deptKey: NoteDeptKey
  control: Control<ShowReportInput>
  register: UseFormRegister<ShowReportInput>
}

function DeptNotesSection({
  label,
  deptKey,
  control,
  register,
}: DeptSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `notes.${deptKey}`,
  })

  return (
    <details
      open={fields.length > 0}
      className="rounded border border-surface-border p-3"
    >
      <summary className="flex cursor-pointer items-center justify-between font-medium">
        <span>
          {label} <span className="text-muted">({fields.length})</span>
        </span>
      </summary>
      <div className="mt-3 space-y-2">
        {fields.map((field, idx) => (
          <div key={field.id} className="flex items-start gap-2">
            <span className="mt-2 text-xs text-muted">#{idx + 1}</span>
            <Input
              {...register(`notes.${deptKey}.${idx}.text`)}
              placeholder="One note per line."
            />
            <Button
              variant="ghost"
              onClick={() => remove(idx)}
              aria-label="Remove note"
            >
              ×
            </Button>
          </div>
        ))}
        <Button variant="secondary" onClick={() => append({ text: '' })}>
          + Add note
        </Button>
      </div>
    </details>
  )
}
