import { useMemo, useState } from 'react'
import { Button } from '@/components/Form'
import RequiresProduction from '@/components/RequiresProduction'
import BlockingGrid from '@/features/blocking/BlockingGrid'
import BlockingList from '@/features/blocking/BlockingList'
import {
  db,
  type BlockingEntry,
  type BlockingPosition,
  type StageZone,
} from '@/lib/db'
import {
  useBlockingEntries,
  useContacts,
  useCurrentProduction,
  useNextBlockingSequence,
} from '@/lib/hooks'
import { useAppStore } from '@/lib/store'

export default function BlockingRoute() {
  return (
    <RequiresProduction>
      <BlockingInner />
    </RequiresProduction>
  )
}

function BlockingInner() {
  const production = useCurrentProduction()
  const productionId = production?.id ?? null
  const contacts = useContacts(productionId)
  const entries = useBlockingEntries(productionId)
  const nextSeq = useNextBlockingSequence(productionId)
  const [activeEntryId, setActiveEntryId] = useState<number | null>(null)
  const [selectedActor, setSelectedActor] = useState<number | null>(null)

  const cast = useMemo(
    () => contacts.filter((c) => c.category === 'cast'),
    [contacts],
  )

  const activeEntry = useMemo(
    () => entries.find((e) => e.id === activeEntryId),
    [entries, activeEntryId],
  )

  if (!production?.id) return null

  async function handleNewEntry() {
    if (!production?.id) return
    const page = activeEntry?.page ?? ''
    const newEntry: Omit<BlockingEntry, 'id'> = {
      productionId: production.id,
      page,
      sequence: nextSeq,
      positions: [],
    }
    const id = await db.blocking.add(newEntry as BlockingEntry)
    setActiveEntryId(id as number)
  }

  async function handleZoneTap(zone: StageZone) {
    if (!activeEntry?.id || !selectedActor) return
    const existing = activeEntry.positions.find(
      (p) => p.contactId === selectedActor,
    )
    let newPositions: BlockingPosition[]
    if (existing && existing.zone === zone) {
      newPositions = activeEntry.positions.filter(
        (p) => p.contactId !== selectedActor,
      )
    } else {
      newPositions = [
        ...activeEntry.positions.filter((p) => p.contactId !== selectedActor),
        { contactId: selectedActor, zone },
      ]
    }
    await db.blocking.update(activeEntry.id, { positions: newPositions })
  }

  async function handleUpdatePage(id: number, page: string) {
    await db.blocking.update(id, { page })
  }

  async function handleUpdateSceneLabel(id: number, sceneLabel: string) {
    await db.blocking.update(id, { sceneLabel: sceneLabel || undefined })
  }

  async function handleUpdateNotes(id: number, notes: string) {
    await db.blocking.update(id, { notes: notes || undefined })
  }

  async function handleDelete(id: number) {
    await db.blocking.delete(id)
    if (activeEntryId === id) {
      setActiveEntryId(null)
    }
  }

  async function handleDuplicate(entry: BlockingEntry) {
    if (!production?.id) return
    const maxSeq =
      entries.length > 0
        ? Math.max(...entries.map((e) => e.sequence))
        : 0
    const newEntry: Omit<BlockingEntry, 'id'> = {
      productionId: production.id,
      page: entry.page,
      sequence: maxSeq + 10,
      sceneLabel: entry.sceneLabel,
      positions: [...entry.positions],
      notes: entry.notes,
    }
    await db.blocking.add(newEntry as BlockingEntry)
  }

  async function downloadPdf() {
    if (!production) return
    const settings = useAppStore.getState().settings
    const [{ pdf }, { default: BlockingPdf }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/features/blocking/BlockingPdf'),
    ])
    const blob = await pdf(
      <BlockingPdf
        production={production}
        entries={entries}
        contacts={cast}
        paperSize={settings.paperSize}
      />,
    ).toBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${production.name.replace(/[^a-z0-9]/gi, '_')}-blocking.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <section className="mx-auto max-w-6xl space-y-8">
      <header>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl">Blocking</h2>
            <p className="mt-1 text-sm text-muted">
              For <span className="font-medium">{production.name}</span>. Tap a
              zone to place the selected actor. Navigate pages to build a
              page-by-page blocking record.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleNewEntry}>+ New page</Button>
          </div>
        </div>
      </header>

      {/* Actor picker */}
      {cast.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {cast.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedActor(c.id ?? null)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                selectedActor === c.id
                  ? 'border-accent bg-accent text-white'
                  : 'border-surface-border bg-surface hover:bg-surface-secondary'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Zone grid */}
      {activeEntry && (
        <BlockingGrid
          entry={activeEntry}
          contacts={cast}
          selectedActor={selectedActor}
          onZoneTap={handleZoneTap}
        />
      )}

      {/* Entry list / page navigator */}
      <BlockingList
        entries={entries}
        activeEntryId={activeEntryId}
        onSelect={(id) => {
          setActiveEntryId(id)
        }}
        onUpdatePage={handleUpdatePage}
        onUpdateSceneLabel={handleUpdateSceneLabel}
        onUpdateNotes={handleUpdateNotes}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />

      {/* Exports */}
      {entries.length > 0 && (
        <section className="space-y-3 border-t border-surface-border pt-8">
          <h3 className="font-display text-xl">Exports</h3>
          <Button onClick={downloadPdf}>Download blocking (PDF)</Button>
        </section>
      )}
    </section>
  )
}
