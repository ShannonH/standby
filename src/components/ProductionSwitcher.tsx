import { Link } from 'react-router-dom'
import { useProductions } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'

/**
 * Always-visible "which show am I in?" indicator + switcher. Lives at
 * the top of the nav so the SM can see and change the active production
 * from any route. Most SMs are on one show at a time and just need to
 * see the name; the dropdown only appears when there's more than one
 * production loaded.
 *
 * Three render modes:
 *   • no productions → null (welcome flow surfaces this elsewhere)
 *   • one production → static label, no switcher needed
 *   • 2+ productions → native <select> for switching, plus a
 *     "Manage…" link to /production for create/edit/delete
 *
 * Native <select> is intentional: best mobile UX (OS-native picker on
 * iOS / Android), keyboard- and screen-reader-accessible by default,
 * trivial to scale to N items.
 */
export default function ProductionSwitcher() {
  const productions = useProductions()
  const currentId = useAppStore((s) => s.currentProductionId)
  const setCurrentId = useAppStore((s) => s.setCurrentProductionId)

  if (productions.length === 0) return null

  const single = productions.length === 1
  const current = productions.find((p) => p.id === currentId) ?? productions[0]

  return (
    <div className="mb-4 rounded border border-surface-border bg-surface-bg/40 px-2 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
        Current show
      </p>
      {single ? (
        <p
          className="mt-0.5 truncate font-display text-sm"
          title={current?.name}
        >
          {current?.name}
        </p>
      ) : (
        <label className="block">
          <span className="sr-only">Switch active production</span>
          <select
            value={currentId ?? ''}
            onChange={(e) => setCurrentId(Number(e.target.value))}
            className="mt-0.5 w-full truncate rounded border border-surface-border bg-card px-1 py-1 font-display text-sm focus:border-[rgb(var(--accent))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--accent))]"
          >
            {currentId === null && (
              <option value="" disabled>
                — Pick a show —
              </option>
            )}
            {productions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <Link
        to="/production"
        className="mt-1 inline-block rounded text-[11px] text-muted underline-offset-2 hover:text-[rgb(var(--accent))] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))]"
      >
        {single ? 'Manage…' : 'Manage shows…'}
      </Link>
    </div>
  )
}
