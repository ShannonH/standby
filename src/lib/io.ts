import {
  db,
  type Contact,
  type ContactGroup,
  type Production,
  type RehearsalReport,
} from './db'

/**
 * Bumped whenever the export format changes shape in a way that an
 * older importer would mishandle. Standby's import path checks this
 * before reading data.
 *
 * v1: initial — production + contacts + contactGroups
 * v2: adds rehearsals
 */
export const SHOW_EXPORT_VERSION = 2

export interface ShowExport {
  schemaVersion: number
  exportedAt: string
  production: Production
  contacts: Contact[]
  contactGroups: ContactGroup[]
  rehearsals: RehearsalReport[]
}

/** Build a portable JSON snapshot of a single production and its entities. */
export async function exportShow(productionId: number): Promise<ShowExport> {
  const production = await db.productions.get(productionId)
  if (!production) throw new Error('Production not found')
  const contacts = await db.contacts
    .where('productionId')
    .equals(productionId)
    .toArray()
  const contactGroups = await db.contactGroups
    .where('productionId')
    .equals(productionId)
    .toArray()
  const rehearsals = await db.rehearsals
    .where('productionId')
    .equals(productionId)
    .toArray()
  return {
    schemaVersion: SHOW_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    production,
    contacts,
    contactGroups,
    rehearsals,
  }
}

/**
 * Import a ShowExport into IndexedDB as a brand-new production (does NOT
 * overwrite an existing one). Returns the new production's id.
 *
 * IDs from the source export are intentionally discarded — fresh ids are
 * assigned and group membership is remapped via an id-translation table.
 */
export async function importShow(data: ShowExport): Promise<number> {
  if (data.schemaVersion !== SHOW_EXPORT_VERSION) {
    throw new Error(
      `Unsupported show export version: ${data.schemaVersion} (this build expects ${SHOW_EXPORT_VERSION})`,
    )
  }
  return db.transaction(
    'rw',
    [db.productions, db.contacts, db.contactGroups, db.rehearsals],
    async () => {
      const now = new Date().toISOString()
      const { id: _ignoredProdId, ...productionData } = data.production
      void _ignoredProdId
      const newProductionId = (await db.productions.add({
        ...productionData,
        updatedAt: now,
      })) as number

      const contactIdMap = new Map<number, number>()
      for (const contact of data.contacts) {
        const { id: oldId, ...contactData } = contact
        const newContactId = (await db.contacts.add({
          ...contactData,
          productionId: newProductionId,
        })) as number
        if (oldId !== undefined) contactIdMap.set(oldId, newContactId)
      }

      for (const group of data.contactGroups) {
        const { id: _ignoredGroupId, ...groupData } = group
        void _ignoredGroupId
        const remappedContactIds = (groupData.contactIds ?? [])
          .map((id) => contactIdMap.get(id))
          .filter((id): id is number => id !== undefined)
        await db.contactGroups.add({
          ...groupData,
          productionId: newProductionId,
          contactIds: remappedContactIds,
        })
      }

      // Rehearsals were added in v2. Older v1 exports won't have this array;
      // importShow refuses non-current versions outright, so this is always
      // present at the type level.
      for (const rehearsal of data.rehearsals ?? []) {
        const { id: _ignoredRehearsalId, ...rehearsalData } = rehearsal
        void _ignoredRehearsalId
        const remappedAttendance = rehearsalData.attendance.map((entry) => ({
          ...entry,
          contactId: contactIdMap.get(entry.contactId) ?? entry.contactId,
        }))
        await db.rehearsals.add({
          ...rehearsalData,
          productionId: newProductionId,
          attendance: remappedAttendance,
        })
      }

      return newProductionId
    },
  )
}

/** Trigger a browser download for a ShowExport. */
export function downloadShowAsFile(showExport: ShowExport): void {
  const safeName = showExport.production.name.replace(/[^a-z0-9]/gi, '_')
  const dateStamp = showExport.exportedAt.slice(0, 10)
  const filename = `${safeName}-${dateStamp}.standby.json`
  const blob = new Blob([JSON.stringify(showExport, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Read a File (from <input type="file"/>) and parse it as a ShowExport. */
export async function readShowFromFile(file: File): Promise<ShowExport> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (err) {
    throw new Error(
      `That file isn't valid JSON: ${
        err instanceof Error ? err.message : String(err)
      }`,
    )
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('schemaVersion' in parsed) ||
    !('production' in parsed)
  ) {
    throw new Error("That doesn't look like a Standby show file.")
  }
  return parsed as ShowExport
}
