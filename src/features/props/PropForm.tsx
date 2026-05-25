import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Checkbox, Field, Input, Select, Textarea } from '@/components/Form'
import { db, type Prop } from '@/lib/db'
import { maybePublishPropList } from '@/lib/publish'
import {
  PROP_SOURCE_LABELS,
  PROP_SPECIAL_HANDLING_LABELS,
  PROP_SPECIAL_HANDLING_VALUES,
  PROP_STATUS_LABELS,
  propFormSchema,
  type PropFormInput,
  type PropSource,
  type PropSpecialHandling,
  type PropStatus,
} from '@/lib/schemas'

interface Props {
  productionId: number
  prop?: Prop
  onSaved?: () => void
  onCancel?: () => void
}

function splitCsv(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function PropForm({
  productionId,
  prop,
  onSaved,
  onCancel,
}: Props) {
  const handlingSet = new Set(prop?.specialHandling ?? [])
  const defaultValues: PropFormInput = prop
    ? {
        name: prop.name,
        scenesText: prop.scenes.join(', '),
        charactersText: prop.characters.join(', '),
        consumable: prop.consumable,
        source: prop.source,
        status: prop.status,
        tableLocation: prop.tableLocation ?? '',
        food: handlingSet.has('food'),
        weapons: handlingSet.has('weapons'),
        fire: handlingSet.has('fire'),
        breakaway: handlingSet.has('breakaway'),
        fragile: handlingSet.has('fragile'),
        liquid: handlingSet.has('liquid'),
        notes: prop.notes ?? '',
      }
    : {
        name: '',
        scenesText: '',
        charactersText: '',
        consumable: false,
        source: 'unknown',
        status: 'needed',
        tableLocation: '',
        food: false,
        weapons: false,
        fire: false,
        breakaway: false,
        fragile: false,
        liquid: false,
        notes: '',
      }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PropFormInput>({
    resolver: zodResolver(propFormSchema),
    defaultValues,
  })

  const onSubmit = async (data: PropFormInput) => {
    const specialHandling: PropSpecialHandling[] =
      PROP_SPECIAL_HANDLING_VALUES.filter((tag) => data[tag])
    const payload: Omit<Prop, 'id'> = {
      productionId,
      name: data.name,
      scenes: splitCsv(data.scenesText),
      characters: splitCsv(data.charactersText),
      consumable: data.consumable,
      source: data.source,
      status: data.status,
      tableLocation: data.tableLocation || undefined,
      specialHandling: specialHandling.length > 0 ? specialHandling : undefined,
      notes: data.notes || undefined,
    }
    if (prop?.id !== undefined) {
      await db.props.update(prop.id, payload)
    } else {
      await db.props.add(payload as Prop)
    }
    void maybePublishPropList(productionId)
    onSaved?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Prop name" error={errors.name?.message}>
        <Input {...register('name')} placeholder="e.g. Hamlet's skull" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Scenes"
          optional
          hint="Comma-separated, e.g. 1.1, 2.3, 4.5"
        >
          <Input {...register('scenesText')} placeholder="1.1, 2.3" />
        </Field>
        <Field
          label="Characters"
          optional
          hint="Comma-separated character names."
        >
          <Input
            {...register('charactersText')}
            placeholder="Hamlet, Horatio"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Status">
          <Select {...register('status')}>
            {(
              Object.entries(PROP_STATUS_LABELS) as [PropStatus, string][]
            ).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Source">
          <Select {...register('source')}>
            {(
              Object.entries(PROP_SOURCE_LABELS) as [PropSource, string][]
            ).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Props-table location" optional>
          <Input
            {...register('tableLocation')}
            placeholder="e.g. SR table, shelf 2"
          />
        </Field>
      </div>

      <fieldset className="space-y-2 border-t border-stone-200 pt-4 dark:border-stone-800">
        <legend className="font-medium">Special handling</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {PROP_SPECIAL_HANDLING_VALUES.map((tag) => (
            <Checkbox
              key={tag}
              {...register(tag)}
              label={PROP_SPECIAL_HANDLING_LABELS[tag]}
            />
          ))}
        </div>
      </fieldset>

      <Checkbox
        {...register('consumable')}
        label="Consumable (food, breakaway, etc. that's used up each performance)"
      />

      <Field label="Notes" optional>
        <Textarea {...register('notes')} rows={2} />
      </Field>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {prop ? 'Save changes' : 'Add prop'}
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
