import {
  useFieldArray,
  useForm,
  type Control,
  type UseFormRegister,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Field, Input, Select } from '@/components/Form'
import {
  db,
  emptyRehearsalNotes,
  type Contact,
  type NoteDeptKey,
  type RehearsalReport,
} from '@/lib/db'
import { maybePublishRehearsalReport } from '@/lib/publish'
import {
  NOTE_DEPT_LABELS,
  rehearsalReportInputSchema,
  type RehearsalReportInput,
} from '@/lib/schemas'

interface Props {
  productionId: number
  report?: RehearsalReport
  cast: Contact[]
  defaultDayNumber: number
  defaultLocation?: string
  onSaved?: () => void
  onCancel?: () => void
}

export default function RehearsalReportForm({
  productionId,
  report,
  cast,
  defaultDayNumber,
  defaultLocation,
  onSaved,
  onCancel,
}: Props) {
  const defaultValues: RehearsalReportInput = report
    ? {
        date: report.date,
        dayNumber: report.dayNumber,
        startTime: report.startTime,
        endTime: report.endTime,
        location: report.location ?? '',
        attendance: report.attendance,
        timeBlocks: report.timeBlocks,
        notes: { ...emptyRehearsalNotes(), ...report.notes },
      }
    : {
        date: new Date().toISOString().slice(0, 10),
        dayNumber: defaultDayNumber,
        startTime: '18:00',
        endTime: '22:00',
        location: defaultLocation ?? '',
        attendance: cast
          .filter((c) => c.id !== undefined)
          .map((c) => ({
            contactId: c.id!,
            status: 'present' as const,
          })),
        timeBlocks: [],
        notes: emptyRehearsalNotes(),
      }

  const form = useForm<RehearsalReportInput>({
    resolver: zodResolver(rehearsalReportInputSchema),
    defaultValues,
  })
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = form

  const attendance = useFieldArray({ control, name: 'attendance' })
  const timeBlocks = useFieldArray({ control, name: 'timeBlocks' })

  const onSubmit = async (data: RehearsalReportInput) => {
    const payload: Omit<RehearsalReport, 'id'> = {
      productionId,
      date: data.date,
      dayNumber: data.dayNumber,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location || undefined,
      attendance: data.attendance,
      timeBlocks: data.timeBlocks,
      notes: data.notes,
    }
    let reportId: number
    if (report?.id !== undefined) {
      await db.rehearsals.update(report.id, payload)
      reportId = report.id
    } else {
      reportId = (await db.rehearsals.add(
        payload as RehearsalReport,
      )) as number
    }
    void maybePublishRehearsalReport(productionId, reportId)
    onSaved?.()
  }

  function contactName(contactId: number): string {
    return cast.find((c) => c.id === contactId)?.name ?? '(unknown)'
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      <section>
        <h3 className="mb-3 font-display text-lg">Header</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Date" error={errors.date?.message}>
            <Input {...register('date')} type="date" />
          </Field>
          <Field label="Day #" error={errors.dayNumber?.message}>
            <Input
              {...register('dayNumber', { valueAsNumber: true })}
              type="number"
              min="1"
            />
          </Field>
          <Field label="Start time" error={errors.startTime?.message}>
            <Input {...register('startTime')} type="time" />
          </Field>
          <Field label="End time" error={errors.endTime?.message}>
            <Input {...register('endTime')} type="time" />
          </Field>
          <Field label="Location" optional>
            <Input {...register('location')} placeholder="e.g. Studio Theatre" />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-display text-lg">Attendance</h3>
        {attendance.fields.length === 0 ? (
          <p className="rounded border border-dashed border-surface-border p-4 text-center text-sm text-muted">
            No cast yet. Add cast in Contacts first — they'll auto-populate here.
          </p>
        ) : (
          <ul className="divide-y divide-surface-border rounded border border-surface-border">
            {attendance.fields.map((field, idx) => {
              const status = watch(`attendance.${idx}.status`)
              return (
                <li
                  key={field.id}
                  className="flex flex-wrap items-center gap-3 p-2"
                >
                  <span className="flex-1 text-sm">
                    {contactName(field.contactId)}
                  </span>
                  <Select
                    {...register(`attendance.${idx}.status`)}
                    className="w-32"
                  >
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                    <option value="excused">Excused</option>
                  </Select>
                  {status === 'late' && (
                    <Input
                      {...register(`attendance.${idx}.minutesLate`, {
                        valueAsNumber: true,
                      })}
                      type="number"
                      min="1"
                      placeholder="min late"
                      className="w-28"
                    />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg">Time breakdown</h3>
          <Button
            variant="secondary"
            onClick={() =>
              timeBlocks.append({ start: '', end: '', activity: '' })
            }
          >
            + Add block
          </Button>
        </div>
        {timeBlocks.fields.length === 0 ? (
          <p className="rounded border border-dashed border-surface-border p-4 text-center text-sm text-muted">
            No time blocks yet. Add one per scene or activity worked.
          </p>
        ) : (
          <ul className="space-y-2">
            {timeBlocks.fields.map((field, idx) => (
              <li
                key={field.id}
                className="grid items-end gap-2 sm:grid-cols-[7rem_7rem_1fr_auto]"
              >
                <Field label={idx === 0 ? 'Start' : ''}>
                  <Input
                    {...register(`timeBlocks.${idx}.start`)}
                    type="time"
                  />
                </Field>
                <Field label={idx === 0 ? 'End' : ''}>
                  <Input {...register(`timeBlocks.${idx}.end`)} type="time" />
                </Field>
                <Field label={idx === 0 ? 'Activity' : ''}>
                  <Input
                    {...register(`timeBlocks.${idx}.activity`)}
                    placeholder="e.g. Act 1, scenes 1–3 worked"
                  />
                </Field>
                <Button
                  variant="ghost"
                  onClick={() => timeBlocks.remove(idx)}
                  aria-label="Remove block"
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-3 font-display text-lg">
          Departmental notes
        </h3>
        <p className="mb-4 text-sm text-muted">
          Notes per department, numbered automatically on export. Default
          phrasing follows Porter &amp; Alcorn's collaborative tone — frame
          notes as questions or requests, not corrections.
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
        <Button type="submit" disabled={isSubmitting}>
          {report ? 'Save changes' : 'Save rehearsal report'}
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

interface DeptSectionProps {
  label: string
  deptKey: NoteDeptKey
  control: Control<RehearsalReportInput>
  register: UseFormRegister<RehearsalReportInput>
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
          {label}{' '}
          <span className="text-muted">({fields.length})</span>
        </span>
      </summary>
      <div className="mt-3 space-y-2">
        {fields.map((field, idx) => (
          <div key={field.id} className="flex items-start gap-2">
            <span className="mt-2 text-xs text-muted">#{idx + 1}</span>
            <Input
              {...register(`notes.${deptKey}.${idx}.text`)}
              placeholder="One note per line — e.g. 'Could we confirm the act 2 prop list by Friday?'"
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
