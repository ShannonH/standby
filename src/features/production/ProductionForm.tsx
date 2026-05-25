import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Checkbox, Field, Input, Select } from '@/components/Form'
import { db, type Production } from '@/lib/db'
import { maybePublishProductionInfo } from '@/lib/publish'
import { productionInputSchema, type ProductionInput } from '@/lib/schemas'
import { useAppStore } from '@/lib/store'

interface Props {
  production?: Production
  onSaved?: (id: number) => void
  onCancel?: () => void
}

export default function ProductionForm({ production, onSaved, onCancel }: Props) {
  const setCurrentProductionId = useAppStore((s) => s.setCurrentProductionId)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductionInput>({
    resolver: zodResolver(productionInputSchema),
    defaultValues: production
      ? {
          name: production.name,
          workingTitle: production.workingTitle ?? '',
          season: production.season ?? '',
          type: production.type,
          organization: production.organization ?? '',
          venue: production.venue ?? '',
          firstRehearsal: production.firstRehearsal ?? '',
          designerRun: production.designerRun ?? '',
          techStart: production.techStart ?? '',
          firstPreview: production.firstPreview ?? '',
          opening: production.opening ?? '',
          closing: production.closing ?? '',
          equityMode: production.equityMode ?? true,
        }
      : {
          name: '',
          type: 'play',
          equityMode: true,
        },
  })

  const onSubmit = async (data: ProductionInput) => {
    const now = new Date().toISOString()
    if (production?.id !== undefined) {
      await db.productions.update(production.id, {
        ...data,
        updatedAt: now,
      })
      void maybePublishProductionInfo(production.id)
      onSaved?.(production.id)
    } else {
      const newId = (await db.productions.add({
        ...data,
        createdAt: now,
        updatedAt: now,
      } as Production)) as number
      setCurrentProductionId(newId)
      void maybePublishProductionInfo(newId)
      onSaved?.(newId)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Field label="Production name" error={errors.name?.message}>
        <Input {...register('name')} placeholder="e.g. Into the Woods" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Working title" optional>
          <Input {...register('workingTitle')} />
        </Field>
        <Field label="Season / year" optional>
          <Input
            {...register('season')}
            placeholder="e.g. Summer 2026"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Production type">
          <Select {...register('type')}>
            <option value="play">Play</option>
            <option value="musical">Musical</option>
            <option value="devised">Devised</option>
            <option value="cabaret">Cabaret</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Producing organization" optional>
          <Input
            {...register('organization')}
            placeholder="e.g. Otterbein Summer Theatre"
          />
        </Field>
      </div>

      <Field label="Venue" optional>
        <Input {...register('venue')} />
      </Field>

      <fieldset className="space-y-3 border-t border-stone-200 pt-4 dark:border-stone-800">
        <legend className="font-serif text-lg font-semibold">Key dates</legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="First rehearsal" optional>
            <Input {...register('firstRehearsal')} type="date" />
          </Field>
          <Field label="Designer run" optional>
            <Input {...register('designerRun')} type="date" />
          </Field>
          <Field label="Tech start" optional>
            <Input {...register('techStart')} type="date" />
          </Field>
          <Field label="First preview" optional>
            <Input {...register('firstPreview')} type="date" />
          </Field>
          <Field label="Opening" optional>
            <Input {...register('opening')} type="date" />
          </Field>
          <Field label="Closing" optional>
            <Input {...register('closing')} type="date" />
          </Field>
        </div>
      </fieldset>

      <Checkbox
        {...register('equityMode')}
        label="Apply AEA Equity defaults (break-time enforcement on schedules, daily call format). On by default for college BFA programs teaching Equity conventions."
      />

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {production ? 'Save changes' : 'Create production'}
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
