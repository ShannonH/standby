import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Field, Input, Select, Textarea } from '@/components/Form'
import { db, type Contact, type LineNote } from '@/lib/db'
import {
  LINE_TYPE_LABELS,
  LINE_TYPE_ORDER,
  lineNoteInputSchema,
  type LineNoteInput,
} from '@/lib/schemas'

interface Props {
  productionId: number
  cast: Contact[]
  /** When set, the form acts as an edit form for an existing note. */
  note?: LineNote
  /** Default rehearsal date — usually today, or the date of the last note. */
  defaultDate: string
  /** Default character id (carries forward to make serial entry for one actor fast). */
  defaultCharacterId?: number
  onSaved?: () => void
  onCancel?: () => void
}

/**
 * Single-note entry/edit form. New-note mode is optimized for keyboard-only
 * fast entry during rehearsal — after save, the form clears (keeping the
 * actor and date) and refocuses the page input.
 */
export default function LineNoteForm({
  productionId,
  cast,
  note,
  defaultDate,
  defaultCharacterId,
  onSaved,
  onCancel,
}: Props) {
  const pageInputRef = useRef<HTMLInputElement | null>(null)
  const isEdit = note !== undefined

  const defaultValues: LineNoteInput = note
    ? {
        rehearsalDate: note.rehearsalDate,
        page: note.page,
        characterId: note.characterId,
        lineType: note.lineType,
        scriptedText: note.scriptedText,
        spokenText: note.spokenText,
        comment: note.comment ?? '',
      }
    : {
        rehearsalDate: defaultDate,
        page: '',
        characterId: defaultCharacterId ?? cast[0]?.id ?? 0,
        lineType: 'paraphrase',
        scriptedText: '',
        spokenText: '',
        comment: '',
      }

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LineNoteInput>({
    resolver: zodResolver(lineNoteInputSchema),
    defaultValues,
  })

  // Focus the page input on mount so the SM can start typing immediately.
  useEffect(() => {
    if (!isEdit) {
      pageInputRef.current?.focus()
    }
  }, [isEdit])

  const onSubmit = async (data: LineNoteInput) => {
    const payload: Omit<LineNote, 'id'> = {
      productionId,
      rehearsalDate: data.rehearsalDate,
      page: data.page,
      characterId: data.characterId,
      lineType: data.lineType,
      scriptedText: data.scriptedText,
      spokenText: data.spokenText,
      comment: data.comment || undefined,
      delivered: note?.delivered ?? false,
    }
    if (note?.id !== undefined) {
      await db.lineNotes.update(note.id, payload)
      onSaved?.()
    } else {
      await db.lineNotes.add(payload as LineNote)
      // Fast-entry: clear scripted/spoken/comment/page, keep actor + date + type.
      reset({
        rehearsalDate: data.rehearsalDate,
        page: '',
        characterId: data.characterId,
        lineType: data.lineType,
        scriptedText: '',
        spokenText: '',
        comment: '',
      })
      setFocus('page')
      onSaved?.()
    }
  }

  const { ref: pageRefRegister, ...pageRest } = register('page')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[10rem_6rem_1fr_10rem]">
        <Field label="Date" required error={errors.rehearsalDate?.message}>
          <Input {...register('rehearsalDate')} type="date" />
        </Field>
        <Field label="Page" required error={errors.page?.message}>
          <Input
            {...pageRest}
            ref={(el) => {
              pageRefRegister(el)
              pageInputRef.current = el
            }}
            placeholder="e.g. 42"
          />
        </Field>
        <Field label="Actor" required error={errors.characterId?.message}>
          <Select {...register('characterId', { valueAsNumber: true })}>
            {cast.length === 0 && <option value="">(no cast)</option>}
            {cast.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.role ? ` — ${c.role}` : ''}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Type" required>
          <Select {...register('lineType')}>
            {LINE_TYPE_ORDER.map((t) => (
              <option key={t} value={t}>
                {LINE_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Scripted (what's on the page)" optional>
          <Textarea
            {...register('scriptedText')}
            rows={2}
            placeholder="The line as written."
          />
        </Field>
        <Field label="Spoken (what was said)" optional>
          <Textarea
            {...register('spokenText')}
            rows={2}
            placeholder="What the actor actually said."
          />
        </Field>
      </div>

      <Field label="Comment" optional>
        <Input
          {...register('comment')}
          placeholder="Optional context."
        />
      </Field>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting || cast.length === 0}>
          {isEdit ? 'Save changes' : 'Save note & next (Enter)'}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            {isEdit ? 'Cancel' : 'Done'}
          </Button>
        )}
      </div>
    </form>
  )
}
