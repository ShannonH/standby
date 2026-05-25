import { describe, expect, it, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, type Production } from './db'
import { exportShow, importShow, SHOW_EXPORT_VERSION } from './io'

async function seedShow(): Promise<number> {
  const productionId = (await db.productions.add({
    name: 'Test Musical',
    type: 'musical',
    season: 'Summer 2026',
    organization: 'Otterbein Summer Theatre',
    venue: 'Cowan Hall',
    firstRehearsal: '2026-06-01',
    opening: '2026-07-15',
    closing: '2026-07-27',
    equityMode: true,
    createdAt: '2026-05-25T00:00:00.000Z',
    updatedAt: '2026-05-25T00:00:00.000Z',
  } as Production)) as number

  const contactA = (await db.contacts.add({
    productionId,
    category: 'cast',
    name: 'Alice',
    role: 'Lead',
    email: 'alice@example.com',
    pronouns: 'she/her',
  })) as number

  const contactB = (await db.contacts.add({
    productionId,
    category: 'creative',
    name: 'Bob',
    role: 'Director',
    pronouns: 'they/them',
  })) as number

  await db.contactGroups.add({
    productionId,
    name: 'All Cast',
    contactIds: [contactA, contactB],
  })

  return productionId
}

describe('io: export/import round-trip', () => {
  beforeEach(async () => {
    await db.productions.clear()
    await db.contacts.clear()
    await db.contactGroups.clear()
    await db.props.clear()
    await db.lineNotes.clear()
    await db.rehearsals.clear()
    await db.sendLog.clear()
  })

  it('exports a production with schema version, contacts, and groups', async () => {
    const id = await seedShow()
    const exported = await exportShow(id)

    expect(exported.schemaVersion).toBe(SHOW_EXPORT_VERSION)
    expect(exported.production.name).toBe('Test Musical')
    expect(exported.contacts).toHaveLength(2)
    expect(exported.contactGroups).toHaveLength(1)
    expect(exported.contactGroups[0]!.contactIds).toHaveLength(2)
  })

  it('round-trips: import preserves data and assigns fresh ids', async () => {
    const originalId = await seedShow()
    const exported = await exportShow(originalId)
    const newId = await importShow(exported)

    expect(newId).not.toBe(originalId)

    const imported = await db.productions.get(newId)
    expect(imported?.name).toBe('Test Musical')
    expect(imported?.type).toBe('musical')

    const importedContacts = await db.contacts
      .where('productionId')
      .equals(newId)
      .toArray()
    expect(importedContacts).toHaveLength(2)
    expect(importedContacts.map((c) => c.name).sort()).toEqual(['Alice', 'Bob'])

    const importedGroups = await db.contactGroups
      .where('productionId')
      .equals(newId)
      .toArray()
    expect(importedGroups).toHaveLength(1)
    expect(importedGroups[0]!.contactIds).toHaveLength(2)

    // Group members must point to the NEW contact ids, not the originals.
    const newContactIds = importedContacts.map((c) => c.id!)
    for (const memberId of importedGroups[0]!.contactIds) {
      expect(newContactIds).toContain(memberId)
    }
  })

  it('rejects exports with a future schema version', async () => {
    await expect(
      importShow({
        schemaVersion: SHOW_EXPORT_VERSION + 99,
        exportedAt: new Date().toISOString(),
        production: {
          name: 'x',
          type: 'play',
          createdAt: '',
          updatedAt: '',
        },
        contacts: [],
        contactGroups: [],
        rehearsals: [],
      }),
    ).rejects.toThrow(/Unsupported show export version/)
  })
})
