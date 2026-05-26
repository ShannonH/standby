import { describe, expect, it, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { db } from './db'
import { importShow, SHOW_EXPORT_VERSION, type ShowExport } from './io'
import { SAMPLE_SHOWS } from './sample-show'

// We can't `fetch()` from the test harness, so we load the bundled sample
// JSON straight off disk and run it through importShow. This is the same
// data the production app fetches at runtime — keeps the shipped samples
// honest about the current schema. If you bump SHOW_EXPORT_VERSION, this
// test will fail until you also regenerate the sample fixtures.

function loadSampleFromDisk(slug: string): ShowExport {
  const path = resolve(__dirname, `../../public/samples/${slug}.standby.json`)
  const raw = readFileSync(path, 'utf8')
  return JSON.parse(raw) as ShowExport
}

describe('bundled sample shows', () => {
  beforeEach(async () => {
    await db.productions.clear()
    await db.contacts.clear()
    await db.contactGroups.clear()
    await db.rehearsals.clear()
    await db.lineNotes.clear()
    await db.props.clear()
    await db.sendLog.clear()
    await db.dailyCalls.clear()
    await db.tracking.clear()
    await db.blocking.clear()
    await db.breakLogs.clear()
    await db.showReports.clear()
    await db.characters.clear()
    await db.scenes.clear()
    await db.sceneAppearances.clear()
  })

  for (const sample of SAMPLE_SHOWS) {
    it(`${sample.slug}: matches the current schema version`, () => {
      const data = loadSampleFromDisk(sample.slug)
      expect(data.schemaVersion).toBe(SHOW_EXPORT_VERSION)
    })

    it(`${sample.slug}: imports cleanly and populates every section`, async () => {
      const data = loadSampleFromDisk(sample.slug)
      const newId = await importShow(data)
      expect(newId).toBeGreaterThan(0)

      const counts = {
        contacts: (
          await db.contacts.where('productionId').equals(newId).toArray()
        ).length,
        groups: (
          await db.contactGroups.where('productionId').equals(newId).toArray()
        ).length,
        rehearsals: (
          await db.rehearsals.where('productionId').equals(newId).toArray()
        ).length,
        props: (await db.props.where('productionId').equals(newId).toArray())
          .length,
        dailyCalls: (
          await db.dailyCalls.where('productionId').equals(newId).toArray()
        ).length,
        tracking: (
          await db.tracking.where('productionId').equals(newId).toArray()
        ).length,
        blocking: (
          await db.blocking.where('productionId').equals(newId).toArray()
        ).length,
        showReports: (
          await db.showReports.where('productionId').equals(newId).toArray()
        ).length,
        characters: (
          await db.characters.where('productionId').equals(newId).toArray()
        ).length,
        scenes: (
          await db.scenes.where('productionId').equals(newId).toArray()
        ).length,
        sceneAppearances: (
          await db.sceneAppearances
            .where('productionId')
            .equals(newId)
            .toArray()
        ).length,
      }

      // Every section must have something in it — otherwise the sample
      // isn't doing its job demoing the feature surface.
      for (const [section, count] of Object.entries(counts)) {
        expect(count, `${sample.slug}.${section} should be > 0`).toBeGreaterThan(0)
      }
    })
  }

  it('penzance: musical-specific cast roles are present', async () => {
    const data = loadSampleFromDisk('penzance')
    const newId = await importShow(data)
    const contacts = await db.contacts
      .where('productionId')
      .equals(newId)
      .toArray()
    const roles = contacts.map((c) => c.role ?? '').filter(Boolean)
    expect(roles).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Music Director'),
        expect.stringContaining('Choreographer'),
        expect.stringContaining('Vocal Coach'),
      ]),
    )
  })
})
