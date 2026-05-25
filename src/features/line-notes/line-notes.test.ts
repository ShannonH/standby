import { describe, expect, it, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, type Production } from '@/lib/db'
import { exportShow, importShow } from '@/lib/io'

async function seed() {
  const productionId = (await db.productions.add({
    name: 'Line Notes Test',
    type: 'musical',
    createdAt: '2026-05-25T00:00:00.000Z',
    updatedAt: '2026-05-25T00:00:00.000Z',
  } as Production)) as number

  const aliceId = (await db.contacts.add({
    productionId,
    category: 'cast',
    name: 'Alice',
  })) as number
  const bobId = (await db.contacts.add({
    productionId,
    category: 'cast',
    name: 'Bob',
  })) as number

  await db.lineNotes.add({
    productionId,
    rehearsalDate: '2026-06-15',
    page: '42',
    characterId: aliceId,
    lineType: 'paraphrase',
    scriptedText: 'To be or not to be',
    spokenText: 'To be… or not',
    delivered: false,
  })
  await db.lineNotes.add({
    productionId,
    rehearsalDate: '2026-06-15',
    page: '43',
    characterId: bobId,
    lineType: 'drop',
    scriptedText: 'My lord',
    spokenText: '',
    delivered: true,
  })

  return { productionId, aliceId, bobId }
}

describe('line notes: export/import round-trip', () => {
  beforeEach(async () => {
    await db.productions.clear()
    await db.contacts.clear()
    await db.contactGroups.clear()
    await db.rehearsals.clear()
    await db.lineNotes.clear()
    await db.props.clear()
    await db.sendLog.clear()
  })

  it('includes line notes in the export bundle', async () => {
    const { productionId } = await seed()
    const exported = await exportShow(productionId)
    expect(exported.lineNotes).toHaveLength(2)
    const paraphrase = exported.lineNotes.find(
      (n) => n.lineType === 'paraphrase',
    )
    expect(paraphrase?.scriptedText).toBe('To be or not to be')
  })

  it('round-trips line notes and remaps characterId to the new contact', async () => {
    const { productionId, aliceId, bobId } = await seed()
    const exported = await exportShow(productionId)

    const newProductionId = await importShow(exported)
    const importedNotes = await db.lineNotes
      .where('productionId')
      .equals(newProductionId)
      .toArray()
    expect(importedNotes).toHaveLength(2)

    const newContacts = await db.contacts
      .where('productionId')
      .equals(newProductionId)
      .toArray()
    const newContactIds = newContacts.map((c) => c.id!)
    for (const note of importedNotes) {
      expect(newContactIds).toContain(note.characterId)
      expect([aliceId, bobId]).not.toContain(note.characterId)
    }

    // Delivered flag survives.
    const delivered = importedNotes.filter((n) => n.delivered)
    expect(delivered).toHaveLength(1)
  })
})
