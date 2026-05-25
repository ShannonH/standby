import { Link } from 'react-router-dom'
import { greet } from '@/lib/greeting'
import { useContacts, useCurrentProduction, useProductions } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'

export default function Today() {
  const productions = useProductions()
  const current = useCurrentProduction()
  const contacts = useContacts(current?.id)
  const userName = useAppStore((s) => s.settings.userName) ?? ''
  const greeting = greet(userName)
  const trimmedName = userName.trim()

  if (productions.length === 0) {
    return (
      <section className="mx-auto max-w-3xl">
        <h2 className="font-serif text-3xl font-semibold">
          {trimmedName
            ? `Welcome to Standby, ${trimmedName}.`
            : 'Welcome to Standby'}
        </h2>
        <p className="mt-3 text-muted">
          A free, offline-first paperwork hub for theatre stage managers. Your
          shows live in your browser; nothing leaves this device unless you
          export it.
        </p>
        <p className="mt-6">
          <Link
            to="/production"
            className="inline-block rounded bg-[rgb(var(--accent))] px-4 py-2 text-sm font-semibold text-[rgb(var(--on-accent))] hover:bg-[rgb(var(--accent-hover))]"
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
        <p className="text-sm italic text-muted">{greeting}</p>
        <h2 className="mt-1 font-serif text-3xl font-semibold">Today</h2>
        <p className="mt-3 text-muted">
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
      <p className="text-sm italic text-muted">{greeting}</p>
      <h2 className="mt-1 font-serif text-3xl font-semibold">{current.name}</h2>
      <p className="text-sm text-muted">
        {current.type}
        {current.season ? ` · ${current.season}` : ''}
        {current.organization ? ` · ${current.organization}` : ''}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card label="Contacts" value={contacts.length.toString()} to="/contacts" />
        <Card label="Production details" value="Edit" to="/production" />
      </div>

      <div className="mt-12 space-y-3 border-t border-surface-border pt-6 text-sm text-stone-600 dark:text-stone-400">
        <p className="font-medium text-stone-800 dark:text-stone-200">
          Where to go next
        </p>
        <ul className="space-y-1.5">
          <li>
            <strong>Rehearsals</strong> — nightly report: attendance, time
            breakdown, and notes grouped by department.
          </li>
          <li>
            <strong>Line notes</strong> — capture mistakes during rehearsal.
            Enter saves a note and clears the form so you keep typing.
          </li>
          <li>
            <strong>Props</strong> — master list with status, source, and
            special-handling tags. Click a status to change it inline.
          </li>
          <li>
            <strong>Contacts</strong> — cast, creative, production, crew.
            Build named groups for batched distribution.
          </li>
          <li>
            <strong>Production</strong> — show metadata, key dates, and JSON
            backup/restore.
          </li>
        </ul>
        <p className="pt-2 text-xs">
          Every paperwork page has a <em>Distribute</em> panel that opens
          your mail client with the recipient group BCC'd and the full
          report in the email body — no attachments to remember.
        </p>
      </div>
    </section>
  )
}

function Card({ label, value, to }: { label: string; value: string; to: string }) {
  return (
    <Link
      to={to}
      className="block rounded border border-surface-border p-4 transition hover:border-stone-900 dark:hover:border-stone-100"
    >
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold">{value}</p>
    </Link>
  )
}
