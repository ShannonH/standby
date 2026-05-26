import { useState } from 'react'
import { Button, Field, IconButton, Input, TrashIcon } from '@/components/Form'
import { db } from '@/lib/db'
import { useContactGroups, useContacts } from '@/lib/hooks'

interface Props {
  productionId: number
}

export default function ContactGroupManager({ productionId }: Props) {
  const groups = useContactGroups(productionId)
  const contacts = useContacts(productionId)
  const [newGroupName, setNewGroupName] = useState('')
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)

  async function createGroup() {
    const name = newGroupName.trim()
    if (!name) return
    await db.contactGroups.add({
      productionId,
      name,
      contactIds: [],
    })
    setNewGroupName('')
  }

  async function toggleMembership(groupId: number, contactId: number) {
    const group = await db.contactGroups.get(groupId)
    if (!group) return
    const has = group.contactIds.includes(contactId)
    const next = has
      ? group.contactIds.filter((id) => id !== contactId)
      : [...group.contactIds, contactId]
    await db.contactGroups.update(groupId, { contactIds: next })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Bundle contacts so you can BCC them in one click — "All Cast",
        "Design Team", "Music Team", whatever splits your distribution.
        Every group you create shows up in the recipient picker on the
        Distribute panels.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <Field label="New group name">
          <Input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="e.g. All Cast"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void createGroup()
              }
            }}
          />
        </Field>
        <Button onClick={createGroup} disabled={!newGroupName.trim()}>
          + Create group
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="rounded border border-dashed border-surface-border p-4 text-center text-sm text-muted">
          No groups yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {groups.map((g) => {
            const isOpen = editingGroupId === g.id
            return (
              <li
                key={g.id}
                className="rounded border border-surface-border"
              >
                <div className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-medium">{g.name}</p>
                    <p className="text-xs text-muted">
                      {g.contactIds.length} member
                      {g.contactIds.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setEditingGroupId(isOpen ? null : (g.id ?? null))
                      }
                    >
                      {isOpen ? 'Done' : 'Manage members'}
                    </Button>
                    <IconButton
                      tone="danger"
                      aria-label={`Delete group ${g.name}`}
                      onClick={async () => {
                        if (g.id === undefined) return
                        if (!window.confirm(`Delete group "${g.name}"?`)) return
                        await db.contactGroups.delete(g.id)
                      }}
                    >
                      <TrashIcon />
                    </IconButton>
                  </div>
                </div>
                {isOpen && g.id !== undefined && (
                  <div className="border-t border-surface-border p-3">
                    {contacts.length === 0 ? (
                      <p className="text-sm text-muted">
                        Add contacts first.
                      </p>
                    ) : (
                      <ul className="grid gap-1 sm:grid-cols-2">
                        {contacts.map((c) => {
                          const isMember = g.contactIds.includes(c.id!)
                          return (
                            <li key={c.id}>
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={isMember}
                                  onChange={() =>
                                    c.id !== undefined &&
                                    void toggleMembership(g.id!, c.id)
                                  }
                                  className="h-4 w-4 rounded border-surface-border text-accent focus:ring-accent"
                                />
                                <span>
                                  {c.name}
                                  {c.role && (
                                    <span className="text-muted">
                                      {' '}
                                      · {c.role}
                                    </span>
                                  )}
                                </span>
                              </label>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
