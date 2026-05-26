import { Button, IconButton, TrashIcon } from '@/components/Form'
import { db, NOTE_DEPT_KEYS, type RehearsalReport } from '@/lib/db'
import { useRehearsals } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { formatTime } from '@/lib/time-format'

interface Props {
  productionId: number
  onEdit: (reportId: number) => void
  onDistribute: (reportId: number) => void
  onDownloadPdf: (report: RehearsalReport) => Promise<void>
  /** When the list is empty, the empty state renders a centered "+ New
   *  rehearsal report" button calling this. Lets the route file hide its
   *  header button so we don't double-show the CTA. */
  onCreate?: () => void
}

function totalNotes(report: RehearsalReport): number {
  return NOTE_DEPT_KEYS.reduce(
    (sum, key) => sum + (report.notes[key]?.length ?? 0),
    0,
  )
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

export default function RehearsalReportList({
  productionId,
  onEdit,
  onDistribute,
  onDownloadPdf,
  onCreate,
}: Props) {
  const reports = useRehearsals(productionId)
  const timeFormat = useAppStore((s) => s.settings.timeFormat)

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded border border-dashed border-surface-border p-10 text-center">
        <p className="max-w-md text-sm text-muted">
          No rehearsal reports yet. After a rehearsal, capture attendance,
          what you worked, and notes for each department. The form pre-fills
          today's date and increments the day number for you.
        </p>
        {onCreate && (
          <Button onClick={onCreate}>+ New rehearsal report</Button>
        )}
      </div>
    )
  }

  return (
    <ul className="divide-y divide-surface-border rounded border border-surface-border">
      {reports.map((r) => (
        <li
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-3 p-3"
        >
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold">
              Day {r.dayNumber}{' '}
              <span className="text-muted">· {formatDate(r.date)}</span>
            </p>
            <p className="text-xs text-muted">
              {formatTime(r.startTime, timeFormat)}–
              {formatTime(r.endTime, timeFormat)}
              {r.location ? ` · ${r.location}` : ''} ·{' '}
              {r.attendance.length} attendees · {totalNotes(r)} notes
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => void onDownloadPdf(r)}
            >
              PDF
            </Button>
            <Button
              onClick={() => r.id !== undefined && onDistribute(r.id)}
            >
              Distribute
            </Button>
            <Button
              variant="ghost"
              onClick={() => r.id !== undefined && onEdit(r.id)}
            >
              Edit
            </Button>
            <IconButton
              tone="danger"
              aria-label={`Delete rehearsal report for Day ${r.dayNumber}`}
              onClick={async () => {
                if (r.id === undefined) return
                if (
                  !window.confirm(
                    `Delete the rehearsal report for ${formatDate(r.date)}?`,
                  )
                )
                  return
                await db.rehearsals.delete(r.id)
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
