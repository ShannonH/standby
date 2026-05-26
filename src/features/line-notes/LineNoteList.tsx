import { useMemo, useState } from 'react'
import { Button } from '@/components/Form'
import { db, type Contact, type LineNote } from '@/lib/db'
import { LINE_TYPE_LABELS } from '@/lib/schemas'

interface Props {
  notes: LineNote[]
  cast: Contact[]
  onEdit: (id: number) => void
}

export default function LineNoteList({ notes, cast, onEdit }: Props) {
  const [showDelivered, setShowDelivered] = useState(false)

  const visible = useMemo(
    () => (showDelivered ? notes : notes.filter((n) => !n.delivered)),
    [notes, showDelivered],
  )

  const grouped = useMemo(() => {
    const map = new Map<number, LineNote[]>()
    for (const note of visible) {
      const list = map.get(note.characterId) ?? []
      list.push(note)
      map.set(note.characterId, list)
    }
    return Array.from(map.entries()).sort(([, a], [, b]) => b.length - a.length)
  }, [visible])

  const undeliveredCount = notes.filter((n) => !n.delivered).length
  const deliveredCount = notes.length - undeliveredCount

  if (notes.length === 0) {
    return (
      <p className="rounded border border-dashed border-surface-border p-6 text-center text-sm text-muted">
        No line notes yet. Use the form above to add some during rehearsal —
        Enter saves and clears the form so you can keep typing.
      </p>
    )
  }

  function castName(id: number): string {
    return cast.find((c) => c.id === id)?.name ?? '(unknown)'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <span>
          {undeliveredCount} undelivered · {deliveredCount} delivered
        </span>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showDelivered}
            onChange={(e) => setShowDelivered(e.target.checked)}
            className="h-4 w-4 rounded border-surface-border text-accent focus:ring-accent"
          />
          Show delivered
        </label>
      </div>

      {grouped.length === 0 && (
        <p className="rounded border border-dashed border-surface-border p-6 text-center text-sm text-muted">
          All notes delivered. Toggle "Show delivered" to see history.
        </p>
      )}

      {grouped.map(([characterId, list]) => (
        <section
          key={characterId}
          className="rounded border border-surface-border"
        >
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border bg-card px-3 py-2">
            <h3 className="font-display text-lg">
              {castName(characterId)}{' '}
              <span className="text-sm font-normal text-muted">
                · {list.length} note{list.length === 1 ? '' : 's'}
              </span>
            </h3>
            <Button
              variant="secondary"
              onClick={async () => {
                const undeliveredHere = list.filter((n) => !n.delivered)
                if (undeliveredHere.length === 0) return
                if (
                  !window.confirm(
                    `Mark all ${undeliveredHere.length} note${
                      undeliveredHere.length === 1 ? '' : 's'
                    } for ${castName(characterId)} as delivered?`,
                  )
                )
                  return
                await db.lineNotes
                  .where('characterId')
                  .equals(characterId)
                  .modify({ delivered: true })
              }}
              disabled={list.every((n) => n.delivered)}
            >
              Mark all delivered
            </Button>
          </header>
          <ul className="divide-y divide-surface-border">
            {list.map((n) => (
              <li key={n.id} className="p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted">
                      {n.rehearsalDate} · p.{n.page || '—'} ·{' '}
                      {LINE_TYPE_LABELS[n.lineType]}
                      {n.delivered && (
                        <span className="ml-2 inline-block rounded bg-surface-border/40 px-1.5 py-0.5 text-xs font-medium text-[rgb(var(--text-primary))]">
                          delivered
                        </span>
                      )}
                    </p>
                    <div className="mt-1 grid gap-1 text-sm sm:grid-cols-2">
                      <p>
                        <span className="text-xs uppercase tracking-wide text-muted">
                          Scripted:{' '}
                        </span>
                        {n.scriptedText || '—'}
                      </p>
                      <p>
                        <span className="text-xs uppercase tracking-wide text-muted">
                          Spoken:{' '}
                        </span>
                        {n.spokenText || '—'}
                      </p>
                    </div>
                    {n.comment && (
                      <p className="mt-1 text-xs italic text-muted">
                        {n.comment}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        if (n.id === undefined) return
                        await db.lineNotes.update(n.id, {
                          delivered: !n.delivered,
                        })
                      }}
                    >
                      {n.delivered ? 'Mark undelivered' : 'Mark delivered'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => n.id !== undefined && onEdit(n.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={async () => {
                        if (n.id === undefined) return
                        if (!window.confirm('Delete this line note?')) return
                        await db.lineNotes.delete(n.id)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
