import { useState } from 'react'
import { Button } from '@/components/Form'
import type { BlockingEntry } from '@/lib/db'

interface BlockingListProps {
  entries: BlockingEntry[]
  activeEntryId: number | null
  onSelect: (id: number) => void
  onUpdatePage: (id: number, page: string) => void
  onUpdateSceneLabel: (id: number, sceneLabel: string) => void
  onUpdateNotes: (id: number, notes: string) => void
  onDelete: (id: number) => void
  onDuplicate: (entry: BlockingEntry) => void
}

export default function BlockingList({
  entries,
  activeEntryId,
  onSelect,
  onUpdatePage,
  onUpdateSceneLabel,
  onUpdateNotes,
  onDelete,
  onDuplicate,
}: BlockingListProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editPage, setEditPage] = useState('')
  const [editScene, setEditScene] = useState('')
  const [editNotes, setEditNotes] = useState('')

  function startEditing(entry: BlockingEntry) {
    setEditingId(entry.id ?? null)
    setEditPage(entry.page)
    setEditScene(entry.sceneLabel ?? '')
    setEditNotes(entry.notes ?? '')
  }

  function saveEditing() {
    if (editingId === null) return
    onUpdatePage(editingId, editPage)
    onUpdateSceneLabel(editingId, editScene)
    onUpdateNotes(editingId, editNotes)
    setEditingId(null)
  }

  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-surface-border p-8 text-center text-sm text-muted">
        No blocking entries yet. Click "New page" to start recording positions.
      </p>
    )
  }

  return (
    <div className="space-y-1">
      <h3 className="font-display text-lg">Pages</h3>
      <div className="divide-y divide-surface-border rounded-lg border border-surface-border">
        {entries.map((entry) => {
          const isActive = entry.id === activeEntryId
          const isEditing = entry.id === editingId

          return (
            <div
              key={entry.id}
              className={`flex items-center gap-3 px-4 py-2 ${
                isActive ? 'bg-accent/5' : ''
              }`}
            >
              {isEditing ? (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <input
                    value={editPage}
                    onChange={(e) => setEditPage(e.target.value)}
                    placeholder="Page"
                    className="w-16 rounded border border-surface-border bg-surface px-2 py-1 text-sm"
                  />
                  <input
                    value={editScene}
                    onChange={(e) => setEditScene(e.target.value)}
                    placeholder="Scene label"
                    className="w-40 rounded border border-surface-border bg-surface px-2 py-1 text-sm"
                  />
                  <input
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Notes"
                    className="flex-1 rounded border border-surface-border bg-surface px-2 py-1 text-sm"
                  />
                  <Button onClick={saveEditing}>
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => entry.id && onSelect(entry.id)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <span className="w-12 font-mono text-sm font-medium">
                      p.{entry.page || '?'}
                    </span>
                    <span className="text-sm text-muted">
                      {entry.sceneLabel ?? ''}
                    </span>
                    <span className="ml-auto text-xs text-muted">
                      {entry.positions.length} actor
                      {entry.positions.length !== 1 ? 's' : ''}
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditing(entry)}
                      className="rounded p-1 text-xs text-muted hover:bg-surface-secondary"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => onDuplicate(entry)}
                      className="rounded p-1 text-xs text-muted hover:bg-surface-secondary"
                      title="Duplicate"
                    >
                      ⧉
                    </button>
                    <button
                      onClick={() => entry.id && onDelete(entry.id)}
                      className="rounded p-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
