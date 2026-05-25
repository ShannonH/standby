import { useMemo, useState } from 'react'
import { Button, Input } from '@/components/Form'
import { db, type Contact } from '@/lib/db'
import { useContacts } from '@/lib/hooks'
import ContactForm from './ContactForm'

const CATEGORY_LABELS: Record<Contact['category'], string> = {
  cast: 'Cast',
  creative: 'Creative Team',
  production: 'Production Team',
  crew: 'Crew',
  'venue-admin': 'Venue / Admin',
}

const CATEGORY_ORDER: Contact['category'][] = [
  'cast',
  'creative',
  'production',
  'crew',
  'venue-admin',
]

interface Props {
  productionId: number
}

export default function ContactList({ productionId }: Props) {
  const contacts = useContacts(productionId)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return contacts
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.role?.toLowerCase().includes(q) ?? false) ||
        (c.email?.toLowerCase().includes(q) ?? false),
    )
  }, [contacts, search])

  const grouped = useMemo(() => {
    const out: Record<Contact['category'], Contact[]> = {
      cast: [],
      creative: [],
      production: [],
      crew: [],
      'venue-admin': [],
    }
    for (const c of filtered) out[c.category].push(c)
    return out
  }, [filtered])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, role, or email…"
          className="max-w-sm"
        />
        <Button
          onClick={() => {
            setIsCreating(true)
            setEditingId(null)
          }}
        >
          + New contact
        </Button>
      </div>

      {isCreating && (
        <div className="rounded border border-stone-300 p-4 dark:border-stone-700">
          <h3 className="mb-3 font-serif text-lg font-semibold">New contact</h3>
          <ContactForm
            productionId={productionId}
            onSaved={() => setIsCreating(false)}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      {contacts.length === 0 && !isCreating && (
        <p className="rounded border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500 dark:border-stone-700">
          No contacts yet. Add cast, creative team, designers, and crew here —
          they'll show up on the contact sheet and (later) in distribution
          groups.
        </p>
      )}

      {CATEGORY_ORDER.map((cat) => {
        const list = grouped[cat]
        if (list.length === 0) return null
        return (
          <section key={cat}>
            <h3 className="mb-2 font-serif text-lg font-semibold">
              {CATEGORY_LABELS[cat]}
            </h3>
            <ul className="divide-y divide-stone-200 rounded border border-stone-200 dark:divide-stone-800 dark:border-stone-700">
              {list.map((c) => (
                <li key={c.id} className="p-3">
                  {editingId === c.id ? (
                    <ContactForm
                      productionId={productionId}
                      contact={c}
                      onSaved={() => setEditingId(null)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {c.name}
                          {c.pronouns && (
                            <span className="ml-2 text-xs font-normal text-stone-500">
                              ({c.pronouns})
                            </span>
                          )}
                          {c.doNotPublish && (
                            <span className="ml-2 inline-block rounded bg-stone-200 px-1.5 py-0.5 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                              private
                            </span>
                          )}
                        </p>
                        {c.role && (
                          <p className="text-xs text-stone-500">{c.role}</p>
                        )}
                        <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                          {c.email ?? '—'} · {c.phone ?? '—'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingId(c.id ?? null)
                            setIsCreating(false)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={async () => {
                            if (c.id === undefined) return
                            const confirmed = window.confirm(
                              `Remove ${c.name} from the contact sheet?`,
                            )
                            if (!confirmed) return
                            await db.contacts.delete(c.id)
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
