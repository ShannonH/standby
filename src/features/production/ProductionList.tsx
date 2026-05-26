import { Button, IconButton, TrashIcon } from '@/components/Form'
import { deleteProductionCascade } from '@/lib/db'
import { useProductions } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'

interface Props {
  onEdit?: (productionId: number) => void
}

const TYPE_LABELS: Record<string, string> = {
  play: 'Play',
  musical: 'Musical',
  devised: 'Devised',
  cabaret: 'Cabaret',
  other: 'Other',
}

export default function ProductionList({ onEdit }: Props) {
  const productions = useProductions()
  const currentProductionId = useAppStore((s) => s.currentProductionId)
  const setCurrentProductionId = useAppStore((s) => s.setCurrentProductionId)

  if (productions.length === 0) return null

  return (
    <ul className="space-y-2">
      {productions.map((p) => {
        const isCurrent = p.id === currentProductionId
        return (
          <li
            key={p.id}
            className={`flex flex-wrap items-center justify-between gap-3 rounded border p-3 ${
              isCurrent
                ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent))/0.05]'
                : 'border-surface-border'
            }`}
          >
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold">{p.name}</p>
              <p className="text-xs text-muted">
                {TYPE_LABELS[p.type] ?? p.type}
                {p.season ? ` · ${p.season}` : ''}
                {p.venue ? ` · ${p.venue}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isCurrent ? (
                <span className="rounded bg-[rgb(var(--accent))] px-2 py-1 text-xs font-medium text-[rgb(var(--on-accent))]">
                  Current
                </span>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => p.id !== undefined && setCurrentProductionId(p.id)}
                >
                  Switch to this
                </Button>
              )}
              {onEdit && p.id !== undefined && (
                <Button variant="ghost" onClick={() => onEdit(p.id!)}>
                  Edit
                </Button>
              )}
              <IconButton
                tone="danger"
                aria-label={`Delete production ${p.name}`}
                onClick={async () => {
                  if (p.id === undefined) return
                  const confirmed = window.confirm(
                    `Delete "${p.name}"? This will also delete its contacts, props, and reports. JSON exports already saved to disk are unaffected.`,
                  )
                  if (!confirmed) return
                  await deleteProductionCascade(p.id)
                  if (p.id === currentProductionId) {
                    setCurrentProductionId(null)
                  }
                }}
              >
                <TrashIcon />
              </IconButton>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
