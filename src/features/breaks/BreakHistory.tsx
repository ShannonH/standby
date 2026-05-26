import { Button } from '@/components/Form'
import type { BreakLog } from '@/lib/db'

interface BreakHistoryProps {
  logs: BreakLog[]
  onDelete: (id: number) => void
}

export default function BreakHistory({ logs, onDelete }: BreakHistoryProps) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted">No break logs recorded yet.</p>
    )
  }

  return (
    <section className="space-y-3 border-t border-surface-border pt-6">
      <h3 className="font-display text-lg">Break history</h3>
      <div className="divide-y divide-surface-border rounded-lg border border-surface-border">
        {logs.map((log) => {
          const breakCount = log.events.filter(
            (e) => e.type === 'break-start',
          ).length
          const mealCount = log.events.filter(
            (e) => e.type === 'meal-start',
          ).length
          const wrapped = log.events.some((e) => e.type === 'wrap')

          return (
            <div
              key={log.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{log.date}</p>
                <p className="text-xs text-muted">
                  {log.dayType === '10-of-12' ? '10/12' : 'Regular'} · Called{' '}
                  {log.callTime} · {breakCount} break
                  {breakCount !== 1 ? 's' : ''} · {mealCount} meal
                  {mealCount !== 1 ? 's' : ''}
                  {wrapped && ' · Wrapped'}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => log.id && onDelete(log.id)}
              >
                Delete
              </Button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
