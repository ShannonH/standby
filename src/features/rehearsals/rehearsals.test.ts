import { describe, expect, it, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import {
  db,
  emptyRehearsalNotes,
  type Production,
  type RehearsalReport,
} from '@/lib/db'
import { exportShow, importShow } from '@/lib/io'

async function seed() {
  const productionId = (await db.productions.add({
    name: 'Rehearsal Test Show',
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

  await db.rehearsals.add({
    productionId,
    date: '2026-06-15',
    dayNumber: 1,
    startTime: '18:00',
    endTime: '22:00',
    location: 'Studio Theatre',
    attendance: [
      { contactId: aliceId, status: 'present' },
      { contactId: bobId, status: 'late', minutesLate: 10 },
    ],
    timeBlocks: [
      { start: '18:00', end: '19:30', activity: 'Act 1, scenes 1–3' },
      { start: '19:30', end: '22:00', activity: 'Act 1, scenes 4–6' },
    ],
    notes: {
      ...emptyRehearsalNotes(),
      props: [{ text: 'Hamlet skull needs replacement' }],
      costumes: [
        { text: 'Could we confirm act 2 jacket fitting?' },
        { text: 'Wig 3 returned to stock.' },
      ],
    },
  } as RehearsalReport)

  return { productionId, aliceId, bobId }
}

describe('rehearsals: export/import round-trip', () => {
  beforeEach(async () => {
    await db.productions.clear()
    await db.contacts.clear()
    await db.contactGroups.clear()
    await db.rehearsals.clear()
    await db.props.clear()
    await db.lineNotes.clear()
    await db.sendLog.clear()
  })

  it('includes rehearsals in the export bundle', async () => {
    const { productionId } = await seed()
    const exported = await exportShow(productionId)
    expect(exported.rehearsals).toHaveLength(1)
    expect(exported.rehearsals[0]!.dayNumber).toBe(1)
    expect(exported.rehearsals[0]!.notes.costumes).toHaveLength(2)
  })

  it('round-trips rehearsals and remaps attendance contactIds', async () => {
    const { productionId, aliceId, bobId } = await seed()
    const exported = await exportShow(productionId)

    const newProductionId = await importShow(exported)
    expect(newProductionId).not.toBe(productionId)

    const importedReports = await db.rehearsals
      .where('productionId')
      .equals(newProductionId)
      .toArray()
    expect(importedReports).toHaveLength(1)

    const r = importedReports[0]!
    expect(r.notes.costumes).toHaveLength(2)
    expect(r.notes.props).toHaveLength(1)
    expect(r.attendance).toHaveLength(2)

    // Attendance contactIds should point to the NEW contact rows,
    // not the originals from the source production.
    const newContacts = await db.contacts
      .where('productionId')
      .equals(newProductionId)
      .toArray()
    const newContactIds = newContacts.map((c) => c.id!)
    for (const entry of r.attendance) {
      expect(newContactIds).toContain(entry.contactId)
      expect([aliceId, bobId]).not.toContain(entry.contactId)
    }
  })
})
