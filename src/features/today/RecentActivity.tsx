import { useSendLog } from '@/lib/hooks'
import { relativeTime } from '@/lib/relative-time'
import type { Production } from '@/lib/db'

interface Props {
  production: Production
}

/**
 * Compact send-log feed for the Today dashboard. Same data the
 * Production page's Send Log shows, but limited to the last 4 entries
 * and with friendlier timestamps. No actions here — this is purely a
 * "what have I been doing" surface. If they want to manage send-log
 * entries (delete a row, etc.) they can jump to Production.
 */
export default function RecentActivity({ production }: Props) {
  const productionId = production.id ?? null
  const entries = useSendLog(productionId, 4)

  if (entries.length === 0) return null

  return (
    <section
      aria-labelledby="recent-activity-heading"
      className="rounded-lg border border-surface-border bg-card p-5"
    >
      <h3
        id="recent-activity-heading"
        className="font-display text-lg"
      >
        Recent activity
      </h3>
      <p className="mt-1 text-xs text-muted">
        Distributions you've sent. Local-only — Standby doesn't track
        whether the email actually delivered.
      </p>
      <ul className="mt-3 divide-y divide-surface-border">
        {entries.map((e) => (
          <li key={e.id} className="py-2 text-sm">
            <p className="font-medium">{e.artifact}</p>
            <p className="text-xs text-muted">
              <time
                dateTime={e.sentAt}
                title={new Date(e.sentAt).toLocaleString()}
              >
                {relativeTime(e.sentAt)}
              </time>{' '}
              · {e.recipientGroup} · {e.recipientCount} recipient
              {e.recipientCount === 1 ? '' : 's'}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
