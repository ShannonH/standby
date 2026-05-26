import {
  db,
  type Contact,
  type ContactGroup,
  type DailyCall,
  type LineNote,
  type Production,
  type Prop,
  type RehearsalReport,
  type SendLogEntry,
  type TrackingEntry,
} from './db'

/**
 * Bumped whenever the export format changes shape in a way that an
 * older importer would mishandle. Standby's import path checks this
 * before reading data.
 *
 * v1: initial — production + contacts + contactGroups
 * v2: adds rehearsals
 * v3: adds lineNotes
 * v4: adds props
 * v5: adds sendLog
 * v6: adds dailyCalls
 * v7: adds tracking
 */
export const SHOW_EXPORT_VERSION = 7

export interface ShowExport {
  schemaVersion: number
  exportedAt: string
  production: Production
  contacts: Contact[]
  contactGroups: ContactGroup[]
  rehearsals: RehearsalReport[]
  lineNotes: LineNote[]
  props: Prop[]
  sendLog: SendLogEntry[]
  dailyCalls: DailyCall[]
  tracking: TrackingEntry[]
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
  const lineNotes = await db.lineNotes
    .where('productionId')
    .equals(productionId)
    .toArray()
  const props = await db.props
    .where('productionId')
    .equals(productionId)
    .toArray()
  const sendLog = await db.sendLog
    .where('productionId')
    .equals(productionId)
    .toArray()
  const dailyCalls = await db.dailyCalls
    .where('productionId')
    .equals(productionId)
    .toArray()
  const tracking = await db.tracking
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
    lineNotes,
    props,
    sendLog,
    dailyCalls,
    tracking,
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
    [
      db.productions,
      db.contacts,
      db.contactGroups,
      db.rehearsals,
      db.lineNotes,
      db.props,
      db.sendLog,
      db.dailyCalls,
      db.tracking,
    ],
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

      // Rehearsals were added in v2. importShow refuses non-current
      // versions outright, so this is always present at the type level.
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

      // Line notes added in v3. characterId points at a contact (cast),
      // so it needs remapping like attendance.
      for (const note of data.lineNotes ?? []) {
        const { id: _ignoredNoteId, ...noteData } = note
        void _ignoredNoteId
        await db.lineNotes.add({
          ...noteData,
          productionId: newProductionId,
          characterId:
            contactIdMap.get(noteData.characterId) ?? noteData.characterId,
        })
      }

      // Props added in v4. They don't reference contacts/characters by id,
      // so no remapping is needed.
      for (const prop of data.props ?? []) {
        const { id: _ignoredPropId, ...propData } = prop
        void _ignoredPropId
        await db.props.add({
          ...propData,
          productionId: newProductionId,
        })
      }

      // Send log added in v5. Historical artifact — copied verbatim.
      for (const entry of data.sendLog ?? []) {
        const { id: _ignoredEntryId, ...entryData } = entry
        void _ignoredEntryId
        await db.sendLog.add({
          ...entryData,
          productionId: newProductionId,
        })
      }

      // Daily calls added in v6. They reference contacts by id in callTimes
      // and scheduleItems.calledContactIds — both remapped via the
      // contactIdMap built earlier.
      for (const call of data.dailyCalls ?? []) {
        const { id: _ignoredCallId, ...callData } = call
        void _ignoredCallId
        const remappedCallTimes = callData.callTimes.map((ct) => ({
          ...ct,
          contactId: contactIdMap.get(ct.contactId) ?? ct.contactId,
        }))
        const remappedScheduleItems = callData.scheduleItems.map((si) => ({
          ...si,
          calledContactIds: si.calledContactIds
            .map((id) => contactIdMap.get(id) ?? id),
        }))
        await db.dailyCalls.add({
          ...callData,
          productionId: newProductionId,
          callTimes: remappedCallTimes,
          scheduleItems: remappedScheduleItems,
        })
      }

      // Tracking entries added in v7. contactIds get remapped.
      for (const entry of data.tracking ?? []) {
        const { id: _ignoredId, ...entryData } = entry
        void _ignoredId
        const remappedContactIds = entryData.contactIds
          .map((id) => contactIdMap.get(id) ?? id)
        await db.tracking.add({
          ...entryData,
          productionId: newProductionId,
          contactIds: remappedContactIds,
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
