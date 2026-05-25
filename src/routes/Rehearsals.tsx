import { useState } from 'react'
import { Button } from '@/components/Form'
import RequiresProduction from '@/components/RequiresProduction'
import RehearsalReportForm from '@/features/rehearsals/RehearsalReportForm'
import RehearsalReportList from '@/features/rehearsals/RehearsalReportList'
import { type RehearsalReport } from '@/lib/db'
import {
  useContacts,
  useCurrentProduction,
  useNextDayNumber,
  useRehearsal,
  useRehearsals,
} from '@/lib/hooks'

export default function RehearsalsRoute() {
  return (
    <RequiresProduction>
      <RehearsalsInner />
    </RequiresProduction>
  )
}

type Mode = { kind: 'list' } | { kind: 'new' } | { kind: 'edit'; id: number }

function RehearsalsInner() {
  const production = useCurrentProduction()
  const productionId = production?.id ?? null
  const allContacts = useContacts(productionId)
  const cast = allContacts.filter((c) => c.category === 'cast')
  const nextDayNumber = useNextDayNumber(productionId)
  const reports = useRehearsals(productionId)
  const [mode, setMode] = useState<Mode>({ kind: 'list' })

  const editingReport = useRehearsal(
    mode.kind === 'edit' ? mode.id : null,
  )

  if (!production?.id) return null

  // Use the last report's location as default for the new one (most rehearsals
  // happen in the same room).
  const defaultLocation = reports[0]?.location

  async function downloadPdf(report: RehearsalReport): Promise<void> {
    if (!production) return
    const [{ pdf }, { default: RehearsalReportPdf }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/features/rehearsals/RehearsalReportPdf'),
    ])
    const blob = await pdf(
      <RehearsalReportPdf
        production={production}
        report={report}
        contacts={allContacts}
      />,
    ).toBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${production.name.replace(/[^a-z0-9]/gi, '_')}-rehearsal-day-${report.dayNumber}.pdf`
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
            <h2 className="font-serif text-3xl font-semibold">
              Rehearsal reports
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              For <span className="font-medium">{production.name}</span>.
              Stern &amp; Gold 12e format; Porter &amp; Alcorn-aligned tone
              defaults.
            </p>
          </div>
          {mode.kind === 'list' && (
            <Button onClick={() => setMode({ kind: 'new' })}>
              + New rehearsal report
            </Button>
          )}
        </div>
      </header>

      {mode.kind === 'list' && (
        <RehearsalReportList
          productionId={production.id}
          onEdit={(id) => setMode({ kind: 'edit', id })}
          onDownloadPdf={downloadPdf}
        />
      )}

      {mode.kind === 'new' && (
        <div className="space-y-3 rounded border border-stone-200 p-4 dark:border-stone-700">
          <h3 className="font-serif text-xl font-semibold">
            New rehearsal report
          </h3>
          <RehearsalReportForm
            productionId={production.id}
            cast={cast}
            defaultDayNumber={nextDayNumber}
            defaultLocation={defaultLocation}
            onSaved={() => setMode({ kind: 'list' })}
            onCancel={() => setMode({ kind: 'list' })}
          />
        </div>
      )}

      {mode.kind === 'edit' && editingReport && (
        <div className="space-y-3 rounded border border-stone-200 p-4 dark:border-stone-700">
          <h3 className="font-serif text-xl font-semibold">
            Edit Day {editingReport.dayNumber}
          </h3>
          <RehearsalReportForm
            productionId={production.id}
            report={editingReport}
            cast={cast}
            defaultDayNumber={editingReport.dayNumber}
            onSaved={() => setMode({ kind: 'list' })}
            onCancel={() => setMode({ kind: 'list' })}
          />
        </div>
      )}
    </section>
  )
}
