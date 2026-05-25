import { useState } from 'react'
import AutoBackupPanel from '@/components/AutoBackupPanel'
import ImportExport from '@/components/ImportExport'
import PdfDownloadButton from '@/components/PdfDownloadButton'
import PublishPanel from '@/components/PublishPanel'
import { Button } from '@/components/Form'
import DistributePanel from '@/features/distribution/DistributePanel'
import SendLogList from '@/features/distribution/SendLogList'
import ProductionForm from '@/features/production/ProductionForm'
import ProductionList from '@/features/production/ProductionList'
import { db } from '@/lib/db'
import { useCurrentProduction, useProductions } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { productionInfoBody } from '@/lib/templates'
import { renderProductionInfoText } from '@/lib/text-reports'

export default function ProductionRoute() {
  const productions = useProductions()
  const current = useCurrentProduction()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const editing = editingId !== null ? productions.find((p) => p.id === editingId) : undefined

  async function generatePdf(): Promise<Blob> {
    if (!current) throw new Error('No production selected')
    const paperSize = useAppStore.getState().settings.paperSize
    const [{ pdf }, { default: ProductionInfoPdf }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/features/production/ProductionInfoPdf'),
    ])
    return pdf(
      <ProductionInfoPdf production={current} paperSize={paperSize} />,
    ).toBlob()
  }

  const showCreateForm = isCreating || productions.length === 0

  return (
    <section className="mx-auto max-w-4xl space-y-10">
      <header>
        <h2 className="font-serif text-3xl font-semibold">Production</h2>
        <p className="mt-1 text-sm text-muted">
          The show's name, type, venue, and key dates. Everything else
          (contacts, rehearsals, props) attaches to whichever production
          you have selected — switch between shows with the buttons below.
        </p>
      </header>

      {productions.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-serif text-xl font-semibold">Your productions</h3>
            <Button onClick={() => { setIsCreating(true); setEditingId(null) }}>
              + New production
            </Button>
          </div>
          <ProductionList
            onEdit={(id) => {
              setEditingId(id)
              setIsCreating(false)
            }}
          />
        </section>
      )}

      {showCreateForm && (
        <section className="space-y-3">
          <h3 className="font-serif text-xl font-semibold">
            {productions.length === 0 ? 'Set up your first production' : 'New production'}
          </h3>
          <ProductionForm
            onSaved={() => setIsCreating(false)}
            onCancel={productions.length > 0 ? () => setIsCreating(false) : undefined}
          />
        </section>
      )}

      {editing && (
        <section className="space-y-3">
          <h3 className="font-serif text-xl font-semibold">
            Edit: {editing.name}
          </h3>
          <ProductionForm
            production={editing}
            onSaved={() => setEditingId(null)}
            onCancel={() => setEditingId(null)}
          />
          <Button
            variant="danger"
            onClick={async () => {
              if (editing.id === undefined) return
              if (!window.confirm(`Delete "${editing.name}" and all its data?`)) return
              const { deleteProductionCascade } = await import('@/lib/db')
              await deleteProductionCascade(editing.id)
              setEditingId(null)
            }}
          >
            Delete this production
          </Button>
          {/* db reference for tree-shaking guard */}
          <span className="hidden" data-db-check={Object.keys(db.tables).length} />
        </section>
      )}

      {current && current.id !== undefined && !editing && !isCreating && (
        <>
          <section className="space-y-3">
            <h3 className="font-serif text-xl font-semibold">Exports</h3>
            <PdfDownloadButton
              label="Download production info sheet (PDF)"
              filename={`${current.name.replace(/[^a-z0-9]/gi, '_')}-production-info.pdf`}
              generate={generatePdf}
            />
          </section>

          <DistributePanel
            productionId={current.id}
            artifactLabel="Production information sheet"
            filename={`${current.name.replace(/[^a-z0-9]/gi, '_')}-production-info.pdf`}
            defaultSubject={`Production info — ${current.name}`}
            defaultBody={productionInfoBody(current.name)}
            inlineBody={renderProductionInfoText(current)}
            generatePdf={generatePdf}
          />

          <section className="space-y-3 border-t border-surface-border pt-8">
            <h3 className="font-serif text-xl font-semibold">Send log</h3>
            <SendLogList productionId={current.id} />
          </section>
        </>
      )}

      <AutoBackupPanel productionId={current?.id ?? null} />
      <PublishPanel
        productionId={current?.id ?? null}
        productionName={current?.name}
      />
      <ImportExport productionId={current?.id ?? null} />
    </section>
  )
}
