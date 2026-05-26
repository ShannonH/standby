import { useCallback, useMemo, useState } from 'react'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, IconButton, Input, Select, TrashIcon } from '@/components/Form'
import { db, type Contact, type TrackingEntry } from '@/lib/db'

interface Props {
  entries: TrackingEntry[]
  contacts: Contact[]
  onEdit: (id: number) => void
  onDuplicate: (entry: TrackingEntry) => void
}

function abbreviateName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) return name
  return `${parts[0]![0]}. ${parts[parts.length - 1]}`
}

export default function TrackingTable({
  entries,
  contacts,
  onEdit,
  onDuplicate,
}: Props) {
  const [actorFilter, setActorFilter] = useState<number | ''>('')
  const [search, setSearch] = useState('')

  const nameOf = useMemo(
    () =>
      (id: number): string =>
        contacts.find((c) => c.id === id)?.name ?? '(unknown)',
    [contacts],
  )

  const renderWho = useCallback(
    (entry: TrackingEntry): string => {
      if (entry.whoOverride && entry.contactIds.length === 0) {
        return entry.whoOverride
      }
      const names = entry.contactIds.map((id) => abbreviateName(nameOf(id)))
      if (entry.whoOverride) names.push(entry.whoOverride)
      return names.join(', ')
    },
    [nameOf],
  )

  const isFiltered = actorFilter !== '' || search.trim() !== ''

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter((e) => {
      if (actorFilter !== '' && !e.contactIds.includes(actorFilter)) {
        if (e.kind !== 'scene-shift') return false
      }
      if (!q) return true
      const hay = [
        e.page,
        e.what,
        e.where,
        e.sceneLabel ?? '',
        e.notes ?? '',
        e.whoOverride ?? '',
        renderWho(e),
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [entries, actorFilter, search, renderWho])

  const actorsInTrack = useMemo(() => {
    const ids = new Set<number>()
    for (const e of entries) for (const id of e.contactIds) ids.add(id)
    return contacts.filter((c) => c.id !== undefined && ids.has(c.id))
  }, [entries, contacts])

  // DnD sensors — only active when not filtered (reordering the full list).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = filtered.findIndex((e) => e.id === active.id)
    const newIndex = filtered.findIndex((e) => e.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    // Compute new sequence values by reordering and assigning 10, 20, 30…
    const reordered = arrayMove(filtered, oldIndex, newIndex)
    const updates = reordered.map((entry, i) => ({
      id: entry.id!,
      sequence: (i + 1) * 10,
    }))

    await db.transaction('rw', db.tracking, async () => {
      for (const { id, sequence } of updates) {
        await db.tracking.update(id, { sequence })
      }
    })
  }

  if (entries.length === 0) {
    return (
      <p className="rounded border border-dashed border-surface-border p-6 text-center text-sm text-muted">
        No tracking entries yet. The form above creates one event per row —
        scene shifts, entrances/exits, and crew actions all live in the same
        sequence so you can scan it like a run-sheet.
      </p>
    )
  }

  const sortableIds = filtered.map((e) => e.id!)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        {/* Label-wraps an input here rather than label+for pair because
            Input doesn't accept a stable id (it would conflict with the
            Field context elsewhere). Wrapping is fully equivalent for
            screen readers and skips id-plumbing. */}
        <label className="block min-w-0 flex-1">
          <span className="text-sm font-medium">Search</span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Page, what, where, notes, name…"
            className="mt-1"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Filter by actor</span>
          <Select
            value={actorFilter}
            onChange={(e) =>
              setActorFilter(e.target.value === '' ? '' : Number(e.target.value))
            }
            className="mt-1 w-56"
          >
            <option value="">All actors</option>
            {actorsInTrack.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
        <span className="text-sm text-muted">
          {filtered.length} / {entries.length}
          {!isFiltered && (
            <span className="ml-2 text-xs text-muted">
              ⬍ drag to reorder
            </span>
          )}
        </span>
      </div>

      {/* DndContext + SortableContext wrap the entire scroll container,
          NOT just the <tbody> — putting them between <table> and <tbody>
          injects <div> elements that aren't valid table children and
          breaks the screen-reader accessibility tree (Lighthouse caught
          this). Both contexts render no DOM of their own; they're pure
          providers, so wrapping the table is fine. */}
      {!isFiltered ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="overflow-x-auto rounded border border-surface-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-border/30 text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="w-8 px-1 py-2">
                      <span className="sr-only">Reorder</span>
                    </th>
                    <th scope="col" className="px-3 py-2">Page</th>
                    <th scope="col" className="px-3 py-2">Who</th>
                    <th scope="col" className="px-3 py-2">What</th>
                    <th scope="col" className="px-3 py-2">Where</th>
                    <th scope="col" className="px-3 py-2">Notes</th>
                    <th scope="col" className="px-3 py-2">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filtered.map((e) => (
                    <SortableRow
                      key={e.id}
                      entry={e}
                      renderWho={renderWho}
                      onEdit={onEdit}
                      onDuplicate={onDuplicate}
                      showHandle
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="overflow-x-auto rounded border border-surface-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-border/30 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-3 py-2">Page</th>
                <th scope="col" className="px-3 py-2">Who</th>
                <th scope="col" className="px-3 py-2">What</th>
                <th scope="col" className="px-3 py-2">Where</th>
                <th scope="col" className="px-3 py-2">Notes</th>
                <th scope="col" className="px-3 py-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtered.map((e) => (
                <SortableRow
                  key={e.id}
                  entry={e}
                  renderWho={renderWho}
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  showHandle={false}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Sortable Row ──────────────────────────────────────────────────────────

interface SortableRowProps {
  entry: TrackingEntry
  renderWho: (entry: TrackingEntry) => string
  onEdit: (id: number) => void
  onDuplicate: (entry: TrackingEntry) => void
  showHandle: boolean
}

function SortableRow({
  entry,
  renderWho,
  onEdit,
  onDuplicate,
  showHandle,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id! })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (entry.kind === 'scene-shift') {
    return (
      <tr
        ref={setNodeRef}
        style={style}
        className="bg-surface-border/30"
      >
        {showHandle && (
          <td className="w-8 cursor-grab px-1 py-2 text-center text-muted" {...attributes} {...listeners}>
            ⠿
          </td>
        )}
        <td
          className="px-3 py-2 text-center font-medium uppercase tracking-wide"
          colSpan={5}
        >
          {entry.sceneLabel || 'SCENE SHIFT'}
        </td>
        <td className="px-3 py-2 align-top">
          <RowActions entry={entry} onEdit={onEdit} onDuplicate={onDuplicate} />
        </td>
      </tr>
    )
  }

  const isCrew = entry.kind === 'crew'
  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={isCrew ? 'bg-yellow-100/60 dark:bg-yellow-900/20' : ''}
    >
      {showHandle && (
        <td className="w-8 cursor-grab px-1 py-2 text-center text-muted" {...attributes} {...listeners}>
          ⠿
        </td>
      )}
      <td className="px-3 py-2 align-top text-xs text-muted">{entry.page}</td>
      <td className="px-3 py-2 align-top font-medium">{renderWho(entry)}</td>
      <td className="px-3 py-2 align-top">{entry.what}</td>
      <td className="px-3 py-2 align-top">{entry.where}</td>
      <td className="px-3 py-2 align-top text-xs">{entry.notes ?? ''}</td>
      <td className="px-3 py-2 align-top">
        <RowActions entry={entry} onEdit={onEdit} onDuplicate={onDuplicate} />
      </td>
    </tr>
  )
}

// ─── Row Actions ───────────────────────────────────────────────────────────

function RowActions({
  entry,
  onEdit,
  onDuplicate,
}: {
  entry: TrackingEntry
  onEdit: (id: number) => void
  onDuplicate: (entry: TrackingEntry) => void
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        onClick={() => onDuplicate(entry)}
        title="Duplicate this row"
      >
        Dup
      </Button>
      <Button
        variant="ghost"
        onClick={() => entry.id !== undefined && onEdit(entry.id)}
      >
        Edit
      </Button>
      <IconButton
        tone="danger"
        aria-label="Delete tracking entry"
        onClick={async () => {
          if (entry.id === undefined) return
          if (!window.confirm('Delete this tracking entry?')) return
          await db.tracking.delete(entry.id)
        }}
      >
        <TrashIcon />
      </IconButton>
    </div>
  )
}
