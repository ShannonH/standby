import { useEffect, useState } from 'react'
import { Button } from '@/components/Form'
import RequiresProduction from '@/components/RequiresProduction'
import DistributePanel from '@/features/distribution/DistributePanel'
import DailyCallForm from '@/features/calls/DailyCallForm'
import DailyCallList from '@/features/calls/DailyCallList'
import { type DailyCall } from '@/lib/db'
import {
  useContacts,
  useCurrentProduction,
  useDailyCall,
  useDailyCalls,
  useNextCallVersion,
} from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { dailyCallBody } from '@/lib/templates'
import { renderDailyCallText } from '@/lib/text-reports'

export default function DailyCallRoute() {
  return (
    <RequiresProduction>
      <DailyCallInner />
    </RequiresProduction>
  )
}

type Mode =
  | { kind: 'list' }
  | { kind: 'new'; prefillFrom?: DailyCall }
  | { kind: 'edit'; id: number }
  | { kind: 'distribute'; id: number }

function DailyCallInner() {
  const production = useCurrentProduction()
  const productionId = production?.id ?? null
  const contacts = useContacts(productionId)
  const cast = contacts.filter((c) => c.category === 'cast')
  const calls = useDailyCalls(productionId)
  const [mode, setMode] = useState<Mode>({ kind: 'list' })

  const today = new Date().toISOString().slice(0, 10)
  const editingCall = useDailyCall(mode.kind === 'edit' ? mode.id : null)
  const distributingCall = useDailyCall(
    mode.kind === 'distribute' ? mode.id : null,
  )

  // For new calls: pull the next version number for the chosen date.
  const newDate =
    mode.kind === 'new'
      ? (mode.prefillFrom?.date ?? today)
      : today
  const nextVersion = useNextCallVersion(productionId, newDate)
  const lastLocation = calls[0]?.location

  // Cancel back to list when a destination call disappears (e.g. delete).
  useEffect(() => {
    if (mode.kind === 'edit' && !editingCall && calls.length > 0) {
      setMode({ kind: 'list' })
    }
  }, [mode, editingCall, calls.length])

  if (!production?.id) return null

  async function generateBlob(call: DailyCall): Promise<Blob> {
    if (!production) throw new Error('No production')
    const settings = useAppStore.getState().settings
    const [{ pdf }, { default: DailyCallPdf }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/features/calls/DailyCallPdf'),
    ])
    return pdf(
      <DailyCallPdf
        production={production}
        call={call}
        contacts={contacts}
        paperSize={settings.paperSize}
        timeFormat={settings.timeFormat}
      />,
    ).toBlob()
  }

  async function downloadPdf(call: DailyCall): Promise<void> {
    const blob = await generateBlob(call)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    if (!production) return
    const safe = production.name.replace(/[^a-z0-9]/gi, '_')
    link.download = `${safe}-daily-call-${call.date}-v${call.version}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function duplicate(call: DailyCall) {
    setMode({ kind: 'new', prefillFrom: call })
  }

  const prefillCall =
    mode.kind === 'new' && mode.prefillFrom
      ? {
          ...mode.prefillFrom,
          // Don't carry the id — this is meant to be a new record.
          id: undefined,
          version: nextVersion,
          date: mode.prefillFrom.date ?? today,
        }
      : undefined

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <header>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl font-semibold">Daily call</h2>
            <p className="mt-1 text-sm text-muted">
              For <span className="font-medium">{production.name}</span>. The
              call you send the night before — staggered call times, an
              activity-by-activity schedule, and a "Subject to Change"
              footer. Distribute it from this page with the schedule already
              in the email body.
            </p>
          </div>
          {mode.kind === 'list' && (
            <Button onClick={() => setMode({ kind: 'new' })}>
              + New daily call
            </Button>
          )}
        </div>
      </header>

      {mode.kind === 'list' && (
        <DailyCallList
          productionId={production.id}
          onEdit={(id) => setMode({ kind: 'edit', id })}
          onDistribute={(id) => setMode({ kind: 'distribute', id })}
          onDuplicate={duplicate}
          onDownloadPdf={downloadPdf}
        />
      )}

      {mode.kind === 'new' && (
        <div className="space-y-3 rounded border border-surface-border p-4">
          <h3 className="font-serif text-xl font-semibold">
            {prefillCall ? 'Duplicate as new call' : 'New daily call'}
          </h3>
          <DailyCallForm
            productionId={production.id}
            cast={cast}
            call={prefillCall}
            defaultDate={newDate}
            defaultVersion={nextVersion}
            defaultLocation={lastLocation}
            onSaved={() => setMode({ kind: 'list' })}
            onCancel={() => setMode({ kind: 'list' })}
          />
        </div>
      )}

      {mode.kind === 'edit' && editingCall && (
        <div className="space-y-3 rounded border border-surface-border p-4">
          <h3 className="font-serif text-xl font-semibold">
            Edit call for {editingCall.date}
            {editingCall.version > 1 && ` (v${editingCall.version})`}
          </h3>
          <DailyCallForm
            productionId={production.id}
            call={editingCall}
            cast={cast}
            defaultDate={editingCall.date}
            defaultVersion={editingCall.version}
            defaultLocation={editingCall.location}
            onSaved={() => setMode({ kind: 'list' })}
            onCancel={() => setMode({ kind: 'list' })}
          />
        </div>
      )}

      {mode.kind === 'distribute' && distributingCall && (
        <div className="space-y-3 rounded border border-surface-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-serif text-xl font-semibold">
              Distribute daily call: {distributingCall.date}
              {distributingCall.version > 1 &&
                ` (v${distributingCall.version})`}
            </h3>
            <Button variant="ghost" onClick={() => setMode({ kind: 'list' })}>
              Back to list
            </Button>
          </div>
          <DistributePanel
            productionId={production.id}
            artifactLabel={`Daily Call — ${distributingCall.date} v${distributingCall.version}`}
            filename={`${production.name.replace(/[^a-z0-9]/gi, '_')}-daily-call-${distributingCall.date}-v${distributingCall.version}.pdf`}
            defaultSubject={`Daily call — ${distributingCall.date} — ${production.name}`}
            defaultBody={dailyCallBody(
              production.name,
              distributingCall.date,
              useAppStore.getState().settings.userName,
            )}
            inlineBody={renderDailyCallText(
              production,
              distributingCall,
              contacts,
            )}
            generatePdf={() => generateBlob(distributingCall)}
          />
        </div>
      )}

    </section>
  )
}
