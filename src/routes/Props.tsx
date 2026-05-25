import { useState } from 'react'
import { Button } from '@/components/Form'
import RequiresProduction from '@/components/RequiresProduction'
import DistributePanel from '@/features/distribution/DistributePanel'
import PropForm from '@/features/props/PropForm'
import PropList from '@/features/props/PropList'
import { downloadCsv, toCsv } from '@/lib/csv'
import { useCurrentProduction, useProps } from '@/lib/hooks'
import {
  PROP_SOURCE_LABELS,
  PROP_SPECIAL_HANDLING_LABELS,
  PROP_STATUS_LABELS,
} from '@/lib/schemas'
import { useAppStore } from '@/lib/store'
import { propListBody } from '@/lib/templates'
import { renderPropListText } from '@/lib/text-reports'

export default function PropsRoute() {
  return (
    <RequiresProduction>
      <PropsInner />
    </RequiresProduction>
  )
}

function PropsInner() {
  const production = useCurrentProduction()
  const productionId = production?.id ?? null
  const props = useProps(productionId)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  if (!production?.id) return null

  const editingProp = editingId !== null
    ? props.find((p) => p.id === editingId)
    : undefined

  async function generateBlob(): Promise<Blob> {
    if (!production) throw new Error('No production')
    const { useAppStore } = await import('@/lib/store')
    const paperSize = useAppStore.getState().settings.paperSize
    const [{ pdf }, { default: PropListPdf }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/features/props/PropListPdf'),
    ])
    return pdf(
      <PropListPdf
        production={production}
        props={props}
        paperSize={paperSize}
      />,
    ).toBlob()
  }

  async function downloadPdf(): Promise<void> {
    if (!production) return
    const blob = await generateBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${production.name.replace(/[^a-z0-9]/gi, '_')}-prop-list.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function downloadAsCsv(): void {
    if (!production) return
    const headers = [
      'Name',
      'Scenes',
      'Characters',
      'Status',
      'Source',
      'Consumable',
      'Special Handling',
      'Table Location',
      'Notes',
    ]
    const rows = props.map((p) => [
      p.name,
      p.scenes.join(', '),
      p.characters.join(', '),
      PROP_STATUS_LABELS[p.status],
      PROP_SOURCE_LABELS[p.source],
      p.consumable ? 'yes' : '',
      (p.specialHandling ?? [])
        .map((t) => PROP_SPECIAL_HANDLING_LABELS[t])
        .join(', '),
      p.tableLocation ?? '',
      p.notes ?? '',
    ])
    const csv = toCsv(headers, rows)
    const safeName = production.name.replace(/[^a-z0-9]/gi, '_')
    downloadCsv(`${safeName}-prop-list.csv`, csv)
  }

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <header>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl font-semibold">Props</h2>
            <p className="mt-1 text-sm text-muted">
              For <span className="font-medium">{production.name}</span>. The
              shared truth across the SM, props master, and designers. Click
              a status dropdown in the table to change it without opening
              the full editor. Flag special handling — food, weapons, fire,
              breakaway, fragile, liquid — so nothing's a surprise at tech.
            </p>
          </div>
          {!isCreating && !editingProp && (
            <Button onClick={() => setIsCreating(true)}>+ New prop</Button>
          )}
        </div>
      </header>

      {isCreating && (
        <div className="space-y-3 rounded border border-surface-border p-4">
          <h3 className="font-serif text-xl font-semibold">New prop</h3>
          <PropForm
            productionId={production.id}
            onSaved={() => setIsCreating(false)}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      {editingProp && (
        <div className="space-y-3 rounded border border-surface-border p-4">
          <h3 className="font-serif text-xl font-semibold">
            Edit: {editingProp.name}
          </h3>
          <PropForm
            productionId={production.id}
            prop={editingProp}
            onSaved={() => setEditingId(null)}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      <PropList productionId={production.id} onEdit={setEditingId} />

      {props.length > 0 && production.id !== undefined && (
        <>
          <section className="space-y-3 border-t border-surface-border pt-8">
            <h3 className="font-serif text-xl font-semibold">Exports</h3>
            <div className="flex flex-wrap gap-3">
              <Button onClick={downloadPdf}>Download prop list (PDF)</Button>
              <Button variant="secondary" onClick={downloadAsCsv}>
                Download as CSV (for the props master)
              </Button>
            </div>
          </section>
          <DistributePanel
            productionId={production.id}
            artifactLabel="Prop list"
            filename={`${production.name.replace(/[^a-z0-9]/gi, '_')}-prop-list.pdf`}
            defaultSubject={`Prop list — ${production.name}`}
            defaultBody={propListBody(
              production.name,
              useAppStore.getState().settings.userName,
            )}
            inlineBody={renderPropListText(production, props)}
            generatePdf={generateBlob}
          />
        </>
      )}
    </section>
  )
}
