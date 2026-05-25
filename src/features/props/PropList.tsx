import { useMemo, useState } from 'react'
import { Button, Field, Input, Select } from '@/components/Form'
import { db, type Prop } from '@/lib/db'
import { useProps } from '@/lib/hooks'
import {
  PROP_SOURCE_LABELS,
  PROP_SPECIAL_HANDLING_LABELS,
  PROP_STATUS_LABELS,
  type PropStatus,
} from '@/lib/schemas'

interface Props {
  productionId: number
  onEdit: (id: number) => void
}

export default function PropList({ productionId, onEdit }: Props) {
  const props = useProps(productionId)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PropStatus | ''>('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return props.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.scenes.some((s) => s.toLowerCase().includes(q)) ||
        p.characters.some((c) => c.toLowerCase().includes(q)) ||
        (p.notes?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [props, search, statusFilter])

  if (props.length === 0) {
    return (
      <p className="rounded border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500 dark:border-stone-700">
        No props yet. The prop list grows from the script during pre-production
        and gets reconciled with the props master in rehearsals.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Search">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, scene, character, notes…"
            className="max-w-sm"
          />
        </Field>
        <Field label="Status">
          <Select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as PropStatus | '')
            }
            className="w-44"
          >
            <option value="">All</option>
            {(
              Object.entries(PROP_STATUS_LABELS) as [PropStatus, string][]
            ).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <span className="ml-auto text-sm text-stone-500">
          {filtered.length} / {props.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded border border-stone-200 dark:border-stone-700">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500 dark:bg-stone-900">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Scenes</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Handling</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
            {filtered.map((p) => (
              <PropRow key={p.id} prop={p} onEdit={onEdit} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PropRow({
  prop,
  onEdit,
}: {
  prop: Prop
  onEdit: (id: number) => void
}) {
  return (
    <tr>
      <td className="px-3 py-2 align-top">
        <p className="font-medium">{prop.name}</p>
        {prop.characters.length > 0 && (
          <p className="text-xs text-stone-500">
            {prop.characters.join(', ')}
          </p>
        )}
        {prop.consumable && (
          <p className="text-xs italic text-stone-500">consumable</p>
        )}
      </td>
      <td className="px-3 py-2 align-top text-xs text-stone-600 dark:text-stone-400">
        {prop.scenes.length > 0 ? prop.scenes.join(', ') : '—'}
      </td>
      <td className="px-3 py-2 align-top">
        <select
          value={prop.status}
          onChange={async (e) => {
            if (prop.id === undefined) return
            await db.props.update(prop.id, {
              status: e.target.value as PropStatus,
            })
          }}
          className="rounded border border-stone-300 bg-white px-2 py-1 text-xs dark:border-stone-700 dark:bg-stone-800"
        >
          {(
            Object.entries(PROP_STATUS_LABELS) as [PropStatus, string][]
          ).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2 align-top text-xs">
        {PROP_SOURCE_LABELS[prop.source]}
      </td>
      <td className="px-3 py-2 align-top">
        {prop.specialHandling && prop.specialHandling.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {prop.specialHandling.map((tag) => (
              <span
                key={tag}
                className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
              >
                {PROP_SPECIAL_HANDLING_LABELS[tag]}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-stone-400">—</span>
        )}
      </td>
      <td className="px-3 py-2 align-top">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => prop.id !== undefined && onEdit(prop.id)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (prop.id === undefined) return
              if (!window.confirm(`Delete "${prop.name}"?`)) return
              await db.props.delete(prop.id)
            }}
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
  )
}
