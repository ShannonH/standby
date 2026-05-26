import { db } from '@/lib/db'
import { useSendLog } from '@/lib/hooks'
import { relativeTime } from '@/lib/relative-time'
import { IconButton, TrashIcon } from '@/components/Form'

interface Props {
  productionId: number
  limit?: number
}

export default function SendLogList({ productionId, limit = 20 }: Props) {
  const entries = useSendLog(productionId, limit)

  if (entries.length === 0) {
    return (
      <p className="rounded border border-dashed border-surface-border p-4 text-center text-sm text-muted">
        Nothing distributed yet. When you open your mail client or share via
        system from any of the paperwork pages, it'll log here.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-surface-border rounded border border-surface-border">
        {entries.map((e) => (
          <li
            key={e.id}
            className="flex flex-wrap items-center justify-between gap-2 p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{e.artifact}</p>
              <p className="text-xs text-muted">
                <time
                  dateTime={e.sentAt}
                  title={new Date(e.sentAt).toLocaleString()}
                >
                  {relativeTime(e.sentAt)}
                </time>{' '}
                ·{' '}
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
            <IconButton
              tone="danger"
              aria-label="Delete send-log entry"
              onClick={async () => {
                if (e.id === undefined) return
                if (!window.confirm('Delete this log entry?')) return
                await db.sendLog.delete(e.id)
              }}
            >
              <TrashIcon />
            </IconButton>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">
        Send log is local-only — it records when you opened your mail client,
        not whether the email was actually delivered. Treat it as a personal
        audit trail.
      </p>
    </div>
  )
}
