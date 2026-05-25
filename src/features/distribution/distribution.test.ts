import { describe, expect, it, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, type Production } from '@/lib/db'
import { exportShow, importShow } from '@/lib/io'

async function seed() {
  const productionId = (await db.productions.add({
    name: 'Distribution Test',
    type: 'play',
    createdAt: '',
    updatedAt: '',
  } as Production)) as number

  await db.sendLog.add({
    productionId,
    sentAt: '2026-06-15T22:30:00.000Z',
    artifact: 'Rehearsal Report — Day 1',
    recipientGroup: 'All Cast',
    recipientCount: 12,
    pdfFilename: 'distribution_test-rehearsal-day-1.pdf',
  })
  await db.sendLog.add({
    productionId,
    sentAt: '2026-06-16T22:30:00.000Z',
    artifact: 'Rehearsal Report — Day 2',
    recipientGroup: 'All Cast',
    recipientCount: 12,
  })

  return productionId
}

describe('distribution: send log round-trip', () => {
  beforeEach(async () => {
    await db.productions.clear()
    await db.contacts.clear()
    await db.contactGroups.clear()
    await db.rehearsals.clear()
    await db.lineNotes.clear()
    await db.props.clear()
    await db.sendLog.clear()
  })

  it('includes send log entries in the export', async () => {
    const productionId = await seed()
    const exported = await exportShow(productionId)
    expect(exported.sendLog).toHaveLength(2)
    expect(exported.sendLog[0]!.recipientCount).toBe(12)
  })

  it('round-trips send log entries', async () => {
    const productionId = await seed()
    const exported = await exportShow(productionId)
    const newProductionId = await importShow(exported)

    const imported = await db.sendLog
      .where('productionId')
      .equals(newProductionId)
      .toArray()
    expect(imported).toHaveLength(2)
    expect(imported.map((e) => e.artifact).sort()).toEqual([
      'Rehearsal Report — Day 1',
      'Rehearsal Report — Day 2',
    ])
  })
})
