import { Button } from '@/components/Form'
import { db, NOTE_DEPT_KEYS, type RehearsalReport } from '@/lib/db'
import { useRehearsals } from '@/lib/hooks'

interface Props {
  productionId: number
  onEdit: (reportId: number) => void
  onDistribute: (reportId: number) => void
  onDownloadPdf: (report: RehearsalReport) => Promise<void>
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
}: Props) {
  const reports = useRehearsals(productionId)

  if (reports.length === 0) {
    return (
      <p className="rounded border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500 dark:border-stone-700">
        No rehearsal reports yet. The "+ New rehearsal report" button creates
        your first one.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-stone-200 rounded border border-stone-200 dark:divide-stone-800 dark:border-stone-700">
      {reports.map((r) => (
        <li
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-3 p-3"
        >
          <div className="min-w-0">
            <p className="font-serif text-lg font-semibold">
              Day {r.dayNumber}{' '}
              <span className="text-stone-500">· {formatDate(r.date)}</span>
            </p>
            <p className="text-xs text-stone-500">
              {r.startTime}–{r.endTime}
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
            <Button
              variant="danger"
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
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
