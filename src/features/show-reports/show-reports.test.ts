import { describe, expect, it, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import {
  db,
  emptyRehearsalNotes,
  type Production,
  type ShowReport,
} from '@/lib/db'
import { exportShow, importShow } from '@/lib/io'

async function seed() {
  const productionId = (await db.productions.add({
    name: 'Show Report Test Show',
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

  await db.showReports.add({
    productionId,
    date: '2026-07-15',
    performanceNumber: 1,
    performanceLabel: 'Opening',
    location: 'Cowan Hall',
    curtainUp: '19:30',
    curtainDown: '22:15',
    houseCount: 247,
    lateSeating: 4,
    acts: [
      { label: 'Act I', start: '19:32', end: '20:35' },
      { label: 'Act II', start: '20:50', end: '22:12' },
    ],
    intermissions: [
      { label: 'Intermission', start: '20:35', end: '20:50' },
    ],
    holds: [
      {
        when: 'Top of Act 2',
        durationMinutes: 3,
        reason: 'Audience medical — resolved.',
      },
    ],
    incidents: [
      {
        kind: 'technical',
        description: 'LX cue 142 fired late; spot op was on time, board lag.',
      },
    ],
    understudyChanges: [
      { contactId: bobId, role: 'Mercutio', reason: 'Illness' },
    ],
    notes: {
      ...emptyRehearsalNotes(),
      sound: [{ text: 'Mic 4 popped on Act 1 entrance — battery?' }],
      costumes: [
        { text: 'Hem repair needed on Alice’s Act 2 dress.' },
        { text: 'Wig 3 returned to stock.' },
      ],
    },
  } as ShowReport)

  return { productionId, aliceId, bobId }
}

describe('show reports: export/import round-trip', () => {
  beforeEach(async () => {
    await db.productions.clear()
    await db.contacts.clear()
    await db.contactGroups.clear()
    await db.rehearsals.clear()
    await db.props.clear()
    await db.lineNotes.clear()
    await db.sendLog.clear()
    await db.dailyCalls.clear()
    await db.tracking.clear()
    await db.blocking.clear()
    await db.breakLogs.clear()
    await db.showReports.clear()
  })

  it('includes show reports in the export bundle', async () => {
    const { productionId } = await seed()
    const exported = await exportShow(productionId)
    expect(exported.showReports).toHaveLength(1)
    expect(exported.showReports[0]!.performanceLabel).toBe('Opening')
    expect(exported.showReports[0]!.acts).toHaveLength(2)
    expect(exported.showReports[0]!.incidents).toHaveLength(1)
    expect(exported.showReports[0]!.understudyChanges).toHaveLength(1)
    expect(exported.showReports[0]!.notes.costumes).toHaveLength(2)
  })

  it('round-trips show reports and remaps understudyChange contactIds', async () => {
    const { productionId, aliceId, bobId } = await seed()
    const exported = await exportShow(productionId)

    const newProductionId = await importShow(exported)
    expect(newProductionId).not.toBe(productionId)

    const importedReports = await db.showReports
      .where('productionId')
      .equals(newProductionId)
      .toArray()
    expect(importedReports).toHaveLength(1)

    const r = importedReports[0]!
    expect(r.performanceNumber).toBe(1)
    expect(r.curtainDown).toBe('22:15')
    expect(r.holds).toHaveLength(1)
    expect(r.holds[0]!.reason).toMatch(/Audience medical/)
    expect(r.notes.sound).toHaveLength(1)
    expect(r.notes.costumes).toHaveLength(2)

    // Understudy contactIds should point to the NEW contact rows,
    // not the originals from the source production.
    const newContacts = await db.contacts
      .where('productionId')
      .equals(newProductionId)
      .toArray()
    const newContactIds = newContacts.map((c) => c.id!)
    expect(r.understudyChanges).toHaveLength(1)
    for (const u of r.understudyChanges) {
      expect(newContactIds).toContain(u.contactId)
      expect([aliceId, bobId]).not.toContain(u.contactId)
    }
  })
})
