import { Button } from '@/components/Form'
import { db, NOTE_DEPT_KEYS, type ShowReport } from '@/lib/db'
import { useShowReports } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { formatTime } from '@/lib/time-format'

interface Props {
  productionId: number
  onEdit: (reportId: number) => void
  onDistribute: (reportId: number) => void
  onDownloadPdf: (report: ShowReport) => Promise<void>
}

function totalNotes(report: ShowReport): number {
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

export default function ShowReportList({
  productionId,
  onEdit,
  onDistribute,
  onDownloadPdf,
}: Props) {
  const reports = useShowReports(productionId)
  const timeFormat = useAppStore((s) => s.settings.timeFormat)

  if (reports.length === 0) {
    return (
      <p className="rounded border border-dashed border-surface-border p-6 text-center text-sm text-muted">
        No show reports yet. After a performance, hit "+ New show report" to
        capture run times, holds, incidents, and notes for each department.
        Show reports use the same numbered-by-department notes as your
        rehearsal reports.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-surface-border rounded border border-surface-border">
      {reports.map((r) => {
        const curtainBits = [
          formatTime(r.curtainUp, timeFormat),
          r.curtainDown ? formatTime(r.curtainDown, timeFormat) : null,
        ].filter(Boolean) as string[]
        const summary: string[] = [curtainBits.join('–')]
        if (r.location) summary.push(r.location)
        if (typeof r.houseCount === 'number')
          summary.push(`House ${r.houseCount}`)
        if (r.holds.length > 0)
          summary.push(`${r.holds.length} hold${r.holds.length === 1 ? '' : 's'}`)
        if (r.incidents.length > 0)
          summary.push(
            `${r.incidents.length} incident${r.incidents.length === 1 ? '' : 's'}`,
          )
        summary.push(`${totalNotes(r)} notes`)
        return (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 p-3"
          >
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold">
                {r.performanceLabel}{' '}
                <span className="text-muted">
                  · #{r.performanceNumber} · {formatDate(r.date)}
                </span>
              </p>
              <p className="text-xs text-muted">{summary.join(' · ')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void onDownloadPdf(r)}>
                PDF
              </Button>
              <Button onClick={() => r.id !== undefined && onDistribute(r.id)}>
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
                      `Delete the show report for ${r.performanceLabel} (${formatDate(r.date)})?`,
                    )
                  )
                    return
                  await db.showReports.delete(r.id)
                }}
              >
                Delete
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
