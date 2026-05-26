import { describe, expect, it, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, type Production } from './db'
import {
  exportShow,
  importShow,
  migrateShowExport,
  SHOW_EXPORT_VERSION,
} from './io'

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
    await db.blocking.clear()
    await db.breakLogs.clear()
    await db.showReports.clear()
    await db.characters.clear()
    await db.scenes.clear()
    await db.sceneAppearances.clear()
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

  it('rejects exports from a newer Standby (future schema version)', async () => {
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
        lineNotes: [],
        props: [],
        sendLog: [],
        dailyCalls: [],
        tracking: [],
        blocking: [],
        breakLogs: [],
        showReports: [],
        characters: [],
        scenes: [],
        sceneAppearances: [],
      } as never),
    ).rejects.toThrow(/newer Standby/)
  })

  it("rejects shapes that don't look like a Standby file at all", () => {
    expect(() => migrateShowExport({ foo: 'bar' })).toThrow(
      /doesn't look like a Standby show file/,
    )
    expect(() => migrateShowExport(null)).toThrow(
      /doesn't look like a Standby show file/,
    )
  })

  it('forward-migrates an older (v9) export by filling new sections with empty arrays', () => {
    const v9 = {
      schemaVersion: 9,
      exportedAt: '2026-05-01T00:00:00.000Z',
      production: {
        name: 'Old Show',
        type: 'play',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      contacts: [],
      contactGroups: [],
      rehearsals: [],
      lineNotes: [],
      props: [],
      sendLog: [],
      dailyCalls: [],
      tracking: [],
      blocking: [],
      breakLogs: [],
      showReports: [],
      // No characters / scenes / sceneAppearances — those didn't exist
      // in v9.
    }
    const migrated = migrateShowExport(v9)
    expect(migrated.schemaVersion).toBe(SHOW_EXPORT_VERSION)
    expect(migrated.characters).toEqual([])
    expect(migrated.scenes).toEqual([])
    expect(migrated.sceneAppearances).toEqual([])
    expect(migrated.production.name).toBe('Old Show')
  })

  it('forward-migrates a v1 export (just production + contacts + groups)', () => {
    const v1 = {
      schemaVersion: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      production: {
        name: 'Ancient Show',
        type: 'play',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      contacts: [],
      contactGroups: [],
    }
    const migrated = migrateShowExport(v1)
    expect(migrated.schemaVersion).toBe(SHOW_EXPORT_VERSION)
    // Every section that didn't exist in v1 is now an empty array
    expect(migrated.rehearsals).toEqual([])
    expect(migrated.lineNotes).toEqual([])
    expect(migrated.props).toEqual([])
    expect(migrated.sendLog).toEqual([])
    expect(migrated.dailyCalls).toEqual([])
    expect(migrated.tracking).toEqual([])
    expect(migrated.blocking).toEqual([])
    expect(migrated.breakLogs).toEqual([])
    expect(migrated.showReports).toEqual([])
    expect(migrated.characters).toEqual([])
    expect(migrated.scenes).toEqual([])
    expect(migrated.sceneAppearances).toEqual([])
  })
})
