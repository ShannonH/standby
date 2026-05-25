import { Link } from 'react-router-dom'
import { useContacts, useCurrentProduction, useProductions } from '@/lib/hooks'

export default function Today() {
  const productions = useProductions()
  const current = useCurrentProduction()
  const contacts = useContacts(current?.id)

  if (productions.length === 0) {
    return (
      <section className="mx-auto max-w-3xl">
        <h2 className="font-serif text-3xl font-semibold">
          Welcome to Standby
        </h2>
        <p className="mt-3 text-stone-600 dark:text-stone-400">
          A free, offline-first paperwork hub for theatre stage managers. Your
          shows live in your browser; nothing leaves this device unless you
          export it.
        </p>
        <p className="mt-6">
          <Link
            to="/production"
            className="inline-block rounded bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
          >
            Set up your first production →
          </Link>
        </p>
      </section>
    )
  }

  if (!current) {
    return (
      <section className="mx-auto max-w-3xl">
        <h2 className="font-serif text-3xl font-semibold">Today</h2>
        <p className="mt-3 text-stone-600 dark:text-stone-400">
          No production is currently selected.
        </p>
        <p className="mt-2">
          <Link to="/production" className="underline">
            Pick one or create a new one →
          </Link>
        </p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl">
      <h2 className="font-serif text-3xl font-semibold">{current.name}</h2>
      <p className="text-sm text-stone-500">
        {current.type}
        {current.season ? ` · ${current.season}` : ''}
        {current.organization ? ` · ${current.organization}` : ''}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card label="Contacts" value={contacts.length.toString()} to="/contacts" />
        <Card label="Production details" value="Edit" to="/production" />
      </div>

      <p className="mt-8 text-sm text-stone-500">
        Daily-driver paperwork (rehearsal reports, line notes, prop list,
        distribution) lands in M2. See <code>docs/PRD.md</code> §12.
      </p>
    </section>
  )
}

function Card({ label, value, to }: { label: string; value: string; to: string }) {
  return (
    <Link
      to={to}
      className="block rounded border border-stone-200 p-4 transition hover:border-stone-900 dark:border-stone-700 dark:hover:border-stone-100"
    >
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold">{value}</p>
    </Link>
  )
}
