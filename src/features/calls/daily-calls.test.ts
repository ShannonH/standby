import { describe, expect, it, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, type DailyCall, type Production } from '@/lib/db'
import { exportShow, importShow } from '@/lib/io'

async function seed() {
  const productionId = (await db.productions.add({
    name: 'Daily Call Test',
    type: 'musical',
    createdAt: '',
    updatedAt: '',
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

  await db.dailyCalls.add({
    productionId,
    date: '2026-06-15',
    location: 'Studio Theatre',
    version: 1,
    notes: [{ text: 'Bring scripts!' }],
    callTimes: [
      { contactId: aliceId, time: '10:00' },
      { contactId: bobId, time: '10:30' },
    ],
    scheduleItems: [
      {
        time: '10:00a',
        activity: 'Read-through',
        calledMode: 'all',
        calledContactIds: [],
      },
      {
        time: '11:00a',
        activity: 'Block Act 1, scene 2',
        description: '- Lovers only',
        calledMode: 'specific',
        calledContactIds: [aliceId, bobId],
      },
    ],
  } as DailyCall)

  return { productionId, aliceId, bobId }
}

describe('daily calls: export/import round-trip', () => {
  beforeEach(async () => {
    await db.productions.clear()
    await db.contacts.clear()
    await db.contactGroups.clear()
    await db.rehearsals.clear()
    await db.lineNotes.clear()
    await db.props.clear()
    await db.sendLog.clear()
    await db.dailyCalls.clear()
  })

  it('includes daily calls in the export', async () => {
    const { productionId } = await seed()
    const exported = await exportShow(productionId)
    expect(exported.dailyCalls).toHaveLength(1)
    expect(exported.dailyCalls[0]!.callTimes).toHaveLength(2)
    expect(exported.dailyCalls[0]!.scheduleItems).toHaveLength(2)
  })

  it('remaps contact ids in callTimes and specific scheduleItems', async () => {
    const { productionId, aliceId, bobId } = await seed()
    const exported = await exportShow(productionId)
    const newProductionId = await importShow(exported)

    const importedCalls = await db.dailyCalls
      .where('productionId')
      .equals(newProductionId)
      .toArray()
    expect(importedCalls).toHaveLength(1)

    const call = importedCalls[0]!
    const newContacts = await db.contacts
      .where('productionId')
      .equals(newProductionId)
      .toArray()
    const newContactIds = newContacts.map((c) => c.id!)

    // Call-time contactIds should be new ids, never the originals.
    for (const ct of call.callTimes) {
      expect(newContactIds).toContain(ct.contactId)
      expect([aliceId, bobId]).not.toContain(ct.contactId)
    }

    // Specific schedule-item contactIds should be new ids too.
    const specific = call.scheduleItems.find(
      (si) => si.calledMode === 'specific',
    )!
    for (const id of specific.calledContactIds) {
      expect(newContactIds).toContain(id)
      expect([aliceId, bobId]).not.toContain(id)
    }
  })
})
