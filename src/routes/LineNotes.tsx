import { useState } from 'react'
import { Button, Field, Select } from '@/components/Form'
import RequiresProduction from '@/components/RequiresProduction'
import DistributePanel from '@/features/distribution/DistributePanel'
import LineNoteForm from '@/features/line-notes/LineNoteForm'
import LineNoteList from '@/features/line-notes/LineNoteList'
import { type Contact, type LineNote } from '@/lib/db'
import { downloadCsv, toCsv } from '@/lib/csv'
import {
  useContacts,
  useCurrentProduction,
  useLineNotes,
} from '@/lib/hooks'
import { LINE_TYPE_LABELS } from '@/lib/schemas'
import { lineNotesBody } from '@/lib/templates'
import { renderLineNotesText } from '@/lib/text-reports'

export default function LineNotesRoute() {
  return (
    <RequiresProduction>
      <LineNotesInner />
    </RequiresProduction>
  )
}

function LineNotesInner() {
  const production = useCurrentProduction()
  const productionId = production?.id ?? null
  const allContacts = useContacts(productionId)
  const cast = allContacts.filter((c) => c.category === 'cast')
  const notes = useLineNotes(productionId)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [pdfActorId, setPdfActorId] = useState<number | ''>('')

  if (!production?.id) return null

  const editingNote = editingId !== null
    ? notes.find((n) => n.id === editingId)
    : undefined

  async function downloadActorPdf() {
    if (!production || pdfActorId === '') return
    const actor = cast.find((c) => c.id === pdfActorId)
    if (!actor) return
    const actorNotes = notes.filter((n) => n.characterId === pdfActorId)
    const [{ pdf }, { default: LineNotesPdf }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/features/line-notes/LineNotesPdf'),
    ])
    const blob = await pdf(
      <LineNotesPdf
        production={production}
        actor={actor}
        notes={actorNotes}
      />,
    ).toBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const safeActor = actor.name.replace(/[^a-z0-9]/gi, '_')
    link.download = `${production.name.replace(/[^a-z0-9]/gi, '_')}-line-notes-${safeActor}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function downloadAllCsv() {
    if (!production) return
    const headers = [
      'Date',
      'Page',
      'Actor',
      'Type',
      'Scripted',
      'Spoken',
      'Comment',
      'Delivered',
    ]
    const rows = notes.map((n: LineNote) => {
      const actor: Contact | undefined = allContacts.find(
        (c) => c.id === n.characterId,
      )
      return [
        n.rehearsalDate,
        n.page,
        actor?.name ?? '',
        LINE_TYPE_LABELS[n.lineType],
        n.scriptedText,
        n.spokenText,
        n.comment ?? '',
        n.delivered ? 'yes' : '',
      ]
    })
    const csv = toCsv(headers, rows)
    const safeName = production.name.replace(/[^a-z0-9]/gi, '_')
    downloadCsv(`${safeName}-line-notes.csv`, csv)
  }

  const lastDate = notes[0]?.rehearsalDate ?? new Date().toISOString().slice(0, 10)
  const lastCharacterId = notes[0]?.characterId

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <header>
        <h2 className="font-serif text-3xl font-semibold">Line notes</h2>
        <p className="mt-1 text-sm text-stone-500">
          For <span className="font-medium">{production.name}</span>. Capture
          flubs as they happen — Enter saves a note and re-focuses the page
          field so you can keep typing without leaving the keyboard. The
          list below groups by actor; each actor's notes are private to
          them when you distribute.
        </p>
      </header>

      {cast.length === 0 ? (
        <p className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          Add cast members in Contacts first — line notes need someone to
          attribute lines to.
        </p>
      ) : editingNote ? (
        <div className="space-y-3 rounded border border-stone-200 p-4 dark:border-stone-700">
          <h3 className="font-serif text-xl font-semibold">Edit line note</h3>
          <LineNoteForm
            productionId={production.id}
            cast={cast}
            note={editingNote}
            defaultDate={editingNote.rehearsalDate}
            defaultCharacterId={editingNote.characterId}
            onSaved={() => setEditingId(null)}
            onCancel={() => setEditingId(null)}
          />
        </div>
      ) : (
        <div className="space-y-3 rounded border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-900/50">
          <h3 className="font-serif text-xl font-semibold">Add line note</h3>
          <LineNoteForm
            productionId={production.id}
            cast={cast}
            defaultDate={lastDate}
            defaultCharacterId={lastCharacterId}
          />
        </div>
      )}

      <LineNoteList notes={notes} cast={cast} onEdit={setEditingId} />

      {notes.length > 0 && (
        <>
          <section className="space-y-3 border-t border-stone-200 pt-8 dark:border-stone-800">
            <h3 className="font-serif text-xl font-semibold">Exports</h3>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Per-actor PDF">
                <Select
                  value={pdfActorId}
                  onChange={(e) =>
                    setPdfActorId(
                      e.target.value === '' ? '' : Number(e.target.value),
                    )
                  }
                >
                  <option value="">Pick an actor…</option>
                  {cast
                    .filter((c) => notes.some((n) => n.characterId === c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (
                        {notes.filter((n) => n.characterId === c.id).length})
                      </option>
                    ))}
                </Select>
              </Field>
              <Button onClick={downloadActorPdf} disabled={pdfActorId === ''}>
                Download actor PDF
              </Button>
              <Button variant="secondary" onClick={downloadAllCsv}>
                Download all as CSV
              </Button>
            </div>
            <p className="text-xs text-stone-500">
              Per-actor PDFs only contain that actor's notes (private). The CSV
              is the SM's archive — never give it to actors as-is.
            </p>
          </section>

          {pdfActorId !== '' &&
            production.id !== undefined &&
            (() => {
              const actor = cast.find((c) => c.id === pdfActorId)
              if (!actor) return null
              const actorNotes = notes.filter(
                (n) => n.characterId === pdfActorId,
              )
              return (
                <DistributePanel
                  productionId={production.id}
                  artifactLabel={`Line notes — ${actor.name}`}
                  filename={`${production.name.replace(/[^a-z0-9]/gi, '_')}-line-notes-${actor.name.replace(/[^a-z0-9]/gi, '_')}.pdf`}
                  defaultSubject={`Line notes — ${actor.name} — ${production.name}`}
                  defaultBody={lineNotesBody(actor.name)}
                  inlineBody={renderLineNotesText(production, actor, actorNotes)}
                  generatePdf={async () => {
                    const [{ pdf }, { default: LineNotesPdf }] =
                      await Promise.all([
                        import('@react-pdf/renderer'),
                        import('@/features/line-notes/LineNotesPdf'),
                      ])
                    return pdf(
                      <LineNotesPdf
                        production={production}
                        actor={actor}
                        notes={actorNotes}
                      />,
                    ).toBlob()
                  }}
                />
              )
            })()}
        </>
      )}
    </section>
  )
}
