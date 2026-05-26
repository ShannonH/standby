import { useState } from 'react'
import PdfDownloadButton from '@/components/PdfDownloadButton'
import SampleShowPicker from '@/components/SampleShowPicker'
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

/**
 * Production route — focused on the show itself: list, create, edit,
 * distribute the production info sheet, and inspect the send log. The
 * Backup & storage concerns (auto-backup folder, publish folder, JSON
 * import/export) now live on /backup. Sample-show loading lives in the
 * empty-state CTA below (you wouldn't load a sample after you already
 * have a production set up).
 */
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
  const isFirstRun = productions.length === 0

  return (
    <section className="mx-auto max-w-4xl space-y-10">
      <header>
        <h2 className="font-display text-3xl">Production</h2>
        <p className="mt-1 text-sm text-muted">
          The show's name, type, venue, and key dates. Everything else
          (contacts, rehearsals, props) attaches to whichever production
          you have selected — switch between shows with the buttons below.
        </p>
      </header>

      {productions.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-xl">Your productions</h3>
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
          <h3 className="font-display text-xl">
            {isFirstRun ? 'Set up your first production' : 'New production'}
          </h3>
          <ProductionForm
            onSaved={() => setIsCreating(false)}
            onCancel={productions.length > 0 ? () => setIsCreating(false) : undefined}
          />
        </section>
      )}

      {editing && (
        <section className="space-y-3">
          <h3 className="font-display text-xl">
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
            <h3 className="font-display text-xl">Exports</h3>
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
            defaultBody={productionInfoBody(
              current.name,
              useAppStore.getState().settings.userName,
            )}
            inlineBody={renderProductionInfoText(current)}
            generatePdf={generatePdf}
          />

          <section className="space-y-3 border-t border-surface-border pt-8">
            <h3 className="font-display text-xl">Send log</h3>
            <SendLogList productionId={current.id} />
          </section>
        </>
      )}

      {/* Sample shows live at the bottom of the page so they don't
          compete for attention with the SM's actual productions. On
          first run (no productions yet), the picker is expanded and
          unframed as a secondary CTA next to the create-your-own form
          above. Once there's at least one production, it collapses
          into a <details> so it's reachable for "demo to a colleague /
          train a new SM" moments without dominating the route. */}
      {isFirstRun ? (
        <section className="space-y-3">
          <SampleShowPicker />
        </section>
      ) : (
        <details className="mt-8 rounded border border-surface-border bg-card p-4">
          <summary className="cursor-pointer font-display text-base">
            Load a sample show
            <span className="ml-2 text-xs font-normal text-muted">
              (imports as a new production alongside your existing ones)
            </span>
          </summary>
          <div className="mt-4">
            <SampleShowPicker compact />
          </div>
        </details>
      )}
    </section>
  )
}
