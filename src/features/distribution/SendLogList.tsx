import { db } from '@/lib/db'
import { useSendLog } from '@/lib/hooks'
import { Button } from '@/components/Form'

interface Props {
  productionId: number
  limit?: number
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function SendLogList({ productionId, limit = 20 }: Props) {
  const entries = useSendLog(productionId, limit)

  if (entries.length === 0) {
    return (
      <p className="rounded border border-dashed border-stone-300 p-4 text-center text-sm text-stone-500 dark:border-stone-700">
        Nothing distributed yet. When you open your mail client or share via
        system from any of the paperwork pages, it'll log here.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-stone-200 rounded border border-stone-200 dark:divide-stone-800 dark:border-stone-700">
        {entries.map((e) => (
          <li
            key={e.id}
            className="flex flex-wrap items-center justify-between gap-2 p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{e.artifact}</p>
              <p className="text-xs text-stone-500">
                {formatTimestamp(e.sentAt)} ·{' '}
                <span className="font-medium">{e.recipientGroup}</span> ·{' '}
                {e.recipientCount} recipient
                {e.recipientCount === 1 ? '' : 's'}
                {e.pdfFilename && (
                  <>
                    {' '}
                    · <code>{e.pdfFilename}</code>
                  </>
                )}
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={async () => {
                if (e.id === undefined) return
                if (!window.confirm('Delete this log entry?')) return
                await db.sendLog.delete(e.id)
              }}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-stone-500">
        Send log is local-only — it records when you opened your mail client,
        not whether the email was actually delivered. Treat it as a personal
        audit trail.
      </p>
    </div>
  )
}
