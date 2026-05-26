import { useState } from 'react'
import { Button } from '@/components/Form'
import RequiresProduction from '@/components/RequiresProduction'
import DistributePanel from '@/features/distribution/DistributePanel'
import ShowReportForm from '@/features/show-reports/ShowReportForm'
import ShowReportList from '@/features/show-reports/ShowReportList'
import { type ShowReport } from '@/lib/db'
import {
  useContacts,
  useCurrentProduction,
  useNextPerformanceNumber,
  useShowReport,
  useShowReports,
} from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { showReportBody } from '@/lib/templates'
import { renderShowReportText } from '@/lib/text-reports'

export default function ShowReportsRoute() {
  return (
    <RequiresProduction>
      <ShowReportsInner />
    </RequiresProduction>
  )
}

type Mode =
  | { kind: 'list' }
  | { kind: 'new' }
  | { kind: 'edit'; id: number }
  | { kind: 'distribute'; id: number }

function ShowReportsInner() {
  const production = useCurrentProduction()
  const productionId = production?.id ?? null
  const allContacts = useContacts(productionId)
  const cast = allContacts.filter((c) => c.category === 'cast')
  const nextPerformanceNumber = useNextPerformanceNumber(productionId)
  const reports = useShowReports(productionId)
  const [mode, setMode] = useState<Mode>({ kind: 'list' })

  const editingReport = useShowReport(mode.kind === 'edit' ? mode.id : null)
  const distributingReport = useShowReport(
    mode.kind === 'distribute' ? mode.id : null,
  )

  if (!production?.id) return null

  // Same location and curtain as the most recent report — performances
  // almost always run from the same room at the same time.
  const defaultLocation = reports[0]?.location
  const defaultCurtainUp = reports[0]?.curtainUp

  async function generateBlob(report: ShowReport): Promise<Blob> {
    if (!production) throw new Error('No production')
    const settings = useAppStore.getState().settings
    const [{ pdf }, { default: ShowReportPdf }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/features/show-reports/ShowReportPdf'),
    ])
    return pdf(
      <ShowReportPdf
        production={production}
        report={report}
        contacts={allContacts}
        paperSize={settings.paperSize}
        timeFormat={settings.timeFormat}
      />,
    ).toBlob()
  }

  async function downloadPdf(report: ShowReport): Promise<void> {
    if (!production) return
    const blob = await generateBlob(report)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeLabel = report.performanceLabel.replace(/[^a-z0-9]/gi, '_')
    link.href = url
    link.download = `${production.name.replace(/[^a-z0-9]/gi, '_')}-show-${String(
      report.performanceNumber,
    ).padStart(3, '0')}-${safeLabel}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <header>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl">Show reports</h2>
            <p className="mt-1 text-sm text-muted">
              For <span className="font-medium">{production.name}</span>. The
              after-show report — run times, holds, incidents, understudy /
              swing changes, and numbered department notes. Designers and
              producers read this nightly. Department notes use the same 9-
              dept structure as rehearsal reports, so the team replies with
              the same "Re: Costumes #3" numbering convention.
            </p>
          </div>
          {mode.kind === 'list' && (
            <Button onClick={() => setMode({ kind: 'new' })}>
              + New show report
            </Button>
          )}
        </div>
      </header>

      {mode.kind === 'list' && (
        <ShowReportList
          productionId={production.id}
          onEdit={(id) => setMode({ kind: 'edit', id })}
          onDistribute={(id) => setMode({ kind: 'distribute', id })}
          onDownloadPdf={downloadPdf}
        />
      )}

      {mode.kind === 'distribute' &&
        distributingReport &&
        production.id !== undefined && (
          <div className="space-y-3 rounded border border-surface-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-xl">
                Distribute {distributingReport.performanceLabel}
              </h3>
              <Button
                variant="ghost"
                onClick={() => setMode({ kind: 'list' })}
              >
                Back to list
              </Button>
            </div>
            <DistributePanel
              productionId={production.id}
              artifactLabel={`Show Report — ${distributingReport.performanceLabel}`}
              filename={`${production.name.replace(/[^a-z0-9]/gi, '_')}-show-${String(
                distributingReport.performanceNumber,
              ).padStart(3, '0')}.pdf`}
              defaultSubject={`Show report — ${distributingReport.performanceLabel} (${distributingReport.date}) — ${production.name}`}
              defaultBody={showReportBody(
                production.name,
                distributingReport.performanceLabel,
                distributingReport.date,
                useAppStore.getState().settings.userName,
              )}
              inlineBody={renderShowReportText(
                production,
                distributingReport,
                allContacts,
              )}
              generatePdf={() => generateBlob(distributingReport)}
            />
          </div>
        )}

      {mode.kind === 'new' && (
        <div className="space-y-3 rounded border border-surface-border p-4">
          <h3 className="font-display text-xl">New show report</h3>
          <ShowReportForm
            productionId={production.id}
            cast={cast}
            defaultPerformanceNumber={nextPerformanceNumber}
            defaultLocation={defaultLocation}
            defaultCurtainUp={defaultCurtainUp}
            onSaved={() => setMode({ kind: 'list' })}
            onCancel={() => setMode({ kind: 'list' })}
          />
        </div>
      )}

      {mode.kind === 'edit' && editingReport && (
        <div className="space-y-3 rounded border border-surface-border p-4">
          <h3 className="font-display text-xl">
            Edit {editingReport.performanceLabel}
          </h3>
          <ShowReportForm
            productionId={production.id}
            report={editingReport}
            cast={cast}
            defaultPerformanceNumber={editingReport.performanceNumber}
            onSaved={() => setMode({ kind: 'list' })}
            onCancel={() => setMode({ kind: 'list' })}
          />
        </div>
      )}
    </section>
  )
}
