import { Button, IconButton, TrashIcon } from '@/components/Form'
import { db, type DailyCall } from '@/lib/db'
import { useDailyCalls } from '@/lib/hooks'

interface Props {
  productionId: number
  onEdit: (id: number) => void
  onDistribute: (id: number) => void
  onDownloadPdf: (call: DailyCall) => Promise<void>
  onDuplicate: (call: DailyCall) => void
  /** Empty-state CTA — see RehearsalReportList for the pattern. */
  onCreate?: () => void
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export default function DailyCallList({
  productionId,
  onEdit,
  onDistribute,
  onDownloadPdf,
  onDuplicate,
  onCreate,
}: Props) {
  const calls = useDailyCalls(productionId)

  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded border border-dashed border-surface-border p-10 text-center">
        <p className="max-w-md text-sm text-muted">
          No daily calls yet. The night before each rehearsal, generate one
          pre-filled with today's cast and a default call time you can
          stagger per person.
        </p>
        {onCreate && <Button onClick={onCreate}>+ New daily call</Button>}
      </div>
    )
  }

  return (
    <ul className="divide-y divide-surface-border rounded border border-surface-border">
      {calls.map((c) => (
        <li
          key={c.id}
          className="flex flex-wrap items-center justify-between gap-3 p-3"
        >
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold">
              {formatDate(c.date)}{' '}
              {c.version > 1 && (
                <span className="text-sm font-normal text-muted">
                  · v{c.version}
                </span>
              )}
            </p>
            <p className="text-xs text-muted">
              {c.location} · {c.callTimes.length} call
              {c.callTimes.length === 1 ? '' : 's'} ·{' '}
              {c.scheduleItems.length} item
              {c.scheduleItems.length === 1 ? '' : 's'}
              {c.notes.length > 0 ? ` · ${c.notes.length} note(s)` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void onDownloadPdf(c)}>
              PDF
            </Button>
            <Button
              onClick={() => c.id !== undefined && onDistribute(c.id)}
            >
              Distribute
            </Button>
            <Button variant="ghost" onClick={() => onDuplicate(c)}>
              Duplicate
            </Button>
            <Button
              variant="ghost"
              onClick={() => c.id !== undefined && onEdit(c.id)}
            >
              Edit
            </Button>
            <IconButton
              tone="danger"
              aria-label={`Delete daily call for ${formatDate(c.date)} (v${c.version})`}
              onClick={async () => {
                if (c.id === undefined) return
                if (
                  !window.confirm(
                    `Delete daily call for ${formatDate(c.date)} (v${c.version})?`,
                  )
                )
                  return
                await db.dailyCalls.delete(c.id)
              }}
            >
              <TrashIcon />
            </IconButton>
          </div>
        </li>
      ))}
    </ul>
  )
}
