import { describe, expect, it, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, type Production } from '@/lib/db'
import { exportShow, importShow } from '@/lib/io'

async function seed() {
  const productionId = (await db.productions.add({
    name: 'Props Test Show',
    type: 'play',
    createdAt: '',
    updatedAt: '',
  } as Production)) as number

  await db.props.add({
    productionId,
    name: 'Hamlet skull',
    scenes: ['5.1'],
    characters: ['Hamlet', 'Horatio'],
    consumable: false,
    source: 'build',
    status: 'in-rehearsal',
    specialHandling: ['fragile'],
    notes: 'Yorick',
  })
  await db.props.add({
    productionId,
    name: 'Stage blood',
    scenes: ['5.2'],
    characters: ['Hamlet', 'Claudius'],
    consumable: true,
    source: 'buy',
    status: 'needed',
    specialHandling: ['liquid'],
  })

  return productionId
}

describe('props: export/import round-trip', () => {
  beforeEach(async () => {
    await db.productions.clear()
    await db.contacts.clear()
    await db.contactGroups.clear()
    await db.rehearsals.clear()
    await db.lineNotes.clear()
    await db.props.clear()
    await db.sendLog.clear()
  })

  it('includes props in the export bundle', async () => {
    const productionId = await seed()
    const exported = await exportShow(productionId)
    expect(exported.props).toHaveLength(2)
    expect(exported.props.find((p) => p.consumable)?.name).toBe('Stage blood')
  })

  it('round-trips props with special handling and consumable flag', async () => {
    const productionId = await seed()
    const exported = await exportShow(productionId)
    const newProductionId = await importShow(exported)

    const importedProps = await db.props
      .where('productionId')
      .equals(newProductionId)
      .toArray()
    expect(importedProps).toHaveLength(2)

    const skull = importedProps.find((p) => p.name === 'Hamlet skull')
    expect(skull?.specialHandling).toEqual(['fragile'])
    expect(skull?.consumable).toBe(false)
    expect(skull?.notes).toBe('Yorick')

    const blood = importedProps.find((p) => p.name === 'Stage blood')
    expect(blood?.consumable).toBe(true)
    expect(blood?.specialHandling).toEqual(['liquid'])
  })
})
