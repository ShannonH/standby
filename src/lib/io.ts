import {
  db,
  type BlockingEntry,
  type BreakLog,
  type Character,
  type Contact,
  type ContactGroup,
  type DailyCall,
  type LineNote,
  type Production,
  type Prop,
  type RehearsalReport,
  type Scene,
  type SceneAppearance,
  type SendLogEntry,
  type ShowReport,
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
 * v8: adds blocking + breakLogs
 * v9: adds showReports
 * v10: adds characters + scenes + sceneAppearances (scene breakdown)
 */
export const SHOW_EXPORT_VERSION = 10

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
  blocking: BlockingEntry[]
  breakLogs: BreakLog[]
  showReports: ShowReport[]
  characters: Character[]
  scenes: Scene[]
  sceneAppearances: SceneAppearance[]
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
  const blocking = await db.blocking
    .where('productionId')
    .equals(productionId)
    .toArray()
  const breakLogs = await db.breakLogs
    .where('productionId')
    .equals(productionId)
    .toArray()
  const showReports = await db.showReports
    .where('productionId')
    .equals(productionId)
    .toArray()
  const characters = await db.characters
    .where('productionId')
    .equals(productionId)
    .toArray()
  const scenes = await db.scenes
    .where('productionId')
    .equals(productionId)
    .toArray()
  const sceneAppearances = await db.sceneAppearances
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
    blocking,
    breakLogs,
    showReports,
    characters,
    scenes,
    sceneAppearances,
  }
}

/**
 * Forward-migrate any older ShowExport-shaped object up to the current
 * SHOW_EXPORT_VERSION. Every version bump in this app's history has been
 * purely additive (a new section appended to the bundle, no existing
 * field changed shape) — so the migration is just filling in `[]` for
 * any section that didn't exist yet in the source version.
 *
 * Returns a normalized ShowExport with `schemaVersion = SHOW_EXPORT_VERSION`
 * and every section present (possibly empty).
 *
 * Throws on shapes we genuinely can't handle:
 *   • a future version (`> SHOW_EXPORT_VERSION`) — fields we don't know
 *     about would silently drop. Better to refuse and tell the user to
 *     refresh.
 *   • a missing or non-numeric schemaVersion / production — almost
 *     certainly not a Standby file.
 *
 * Past versions exported by every shipped build are supported back to
 * v1. The migrator is what keeps Rayne's old downloaded JSON from
 * breaking when we add fields between her downloads.
 */
export function migrateShowExport(data: unknown): ShowExport {
  if (
    typeof data !== 'object' ||
    data === null ||
    typeof (data as { schemaVersion?: unknown }).schemaVersion !== 'number' ||
    typeof (data as { production?: unknown }).production !== 'object'
  ) {
    throw new Error("That doesn't look like a Standby show file.")
  }
  const d = data as Record<string, unknown> & {
    schemaVersion: number
    production: Production
  }
  if (d.schemaVersion > SHOW_EXPORT_VERSION) {
    throw new Error(
      `That file is from a newer Standby (v${d.schemaVersion}) than this build understands (v${SHOW_EXPORT_VERSION}). Refresh the page to update Standby, then try again.`,
    )
  }
  if (d.schemaVersion < 1) {
    throw new Error(`Unknown Standby export version: v${d.schemaVersion}.`)
  }
  // Each section was added in a specific version — see SHOW_EXPORT_VERSION
  // jsdoc above. Filling in `[]` for anything missing produces a valid
  // bundle at the current schema with no behavioral change for the SM.
  return {
    schemaVersion: SHOW_EXPORT_VERSION,
    exportedAt:
      typeof d.exportedAt === 'string' ? d.exportedAt : new Date().toISOString(),
    production: d.production,
    contacts: (d.contacts as Contact[] | undefined) ?? [],
    contactGroups: (d.contactGroups as ContactGroup[] | undefined) ?? [],
    rehearsals: (d.rehearsals as RehearsalReport[] | undefined) ?? [],
    lineNotes: (d.lineNotes as LineNote[] | undefined) ?? [],
    props: (d.props as Prop[] | undefined) ?? [],
    sendLog: (d.sendLog as SendLogEntry[] | undefined) ?? [],
    dailyCalls: (d.dailyCalls as DailyCall[] | undefined) ?? [],
    tracking: (d.tracking as TrackingEntry[] | undefined) ?? [],
    blocking: (d.blocking as BlockingEntry[] | undefined) ?? [],
    breakLogs: (d.breakLogs as BreakLog[] | undefined) ?? [],
    showReports: (d.showReports as ShowReport[] | undefined) ?? [],
    characters: (d.characters as Character[] | undefined) ?? [],
    scenes: (d.scenes as Scene[] | undefined) ?? [],
    sceneAppearances:
      (d.sceneAppearances as SceneAppearance[] | undefined) ?? [],
  }
}

/**
 * Import a ShowExport into IndexedDB as a brand-new production (does NOT
 * overwrite an existing one). Returns the new production's id.
 *
 * Older-version exports are forward-migrated up to the current schema
 * before being imported — see migrateShowExport above for the rules.
 *
 * IDs from the source export are intentionally discarded — fresh ids are
 * assigned and group membership is remapped via an id-translation table.
 */
export async function importShow(rawData: ShowExport | unknown): Promise<number> {
  const data = migrateShowExport(rawData)
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
      db.blocking,
      db.breakLogs,
      db.showReports,
      db.characters,
      db.scenes,
      db.sceneAppearances,
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

      // Blocking entries added in v8. positions[].contactId get remapped.
      for (const entry of data.blocking ?? []) {
        const { id: _ignoredId, ...entryData } = entry
        void _ignoredId
        const remappedPositions = entryData.positions.map((pos) => ({
          ...pos,
          contactId: contactIdMap.get(pos.contactId) ?? pos.contactId,
        }))
        await db.blocking.add({
          ...entryData,
          productionId: newProductionId,
          positions: remappedPositions,
        })
      }

      // Break logs added in v8. No contact references — copied verbatim.
      for (const log of data.breakLogs ?? []) {
        const { id: _ignoredId, ...logData } = log
        void _ignoredId
        await db.breakLogs.add({
          ...logData,
          productionId: newProductionId,
        })
      }

      // Show reports added in v9. understudyChanges[].contactId references
      // a contact — remap. Acts / intermissions / holds / incidents don't
      // reference contacts.
      for (const report of data.showReports ?? []) {
        const { id: _ignoredId, ...reportData } = report
        void _ignoredId
        const remappedUnderstudies = reportData.understudyChanges.map(
          (u) => ({
            ...u,
            contactId: contactIdMap.get(u.contactId) ?? u.contactId,
          }),
        )
        await db.showReports.add({
          ...reportData,
          productionId: newProductionId,
          understudyChanges: remappedUnderstudies,
        })
      }

      // Characters added in v10. playedByContactId references a contact;
      // remap via contactIdMap. Track old→new character ids in
      // characterIdMap so sceneAppearances below can remap.
      const characterIdMap = new Map<number, number>()
      for (const character of data.characters ?? []) {
        const { id: oldId, ...characterData } = character
        const newCharacterId = (await db.characters.add({
          ...characterData,
          productionId: newProductionId,
          playedByContactId:
            characterData.playedByContactId !== undefined
              ? (contactIdMap.get(characterData.playedByContactId) ??
                characterData.playedByContactId)
              : undefined,
        })) as number
        if (oldId !== undefined) characterIdMap.set(oldId, newCharacterId)
      }

      // Scenes added in v10. No cross-references; ids are tracked in
      // sceneIdMap for sceneAppearances below.
      const sceneIdMap = new Map<number, number>()
      for (const scene of data.scenes ?? []) {
        const { id: oldId, ...sceneData } = scene
        const newSceneId = (await db.scenes.add({
          ...sceneData,
          productionId: newProductionId,
        })) as number
        if (oldId !== undefined) sceneIdMap.set(oldId, newSceneId)
      }

      // Scene appearances added in v10. Both sceneId and characterId need
      // remapping. If either side doesn't resolve we keep the original id
      // for debuggability, but log nothing — the resulting row will be an
      // orphan that the UI can flag later.
      for (const app of data.sceneAppearances ?? []) {
        const { id: _ignoredId, ...appData } = app
        void _ignoredId
        await db.sceneAppearances.add({
          ...appData,
          productionId: newProductionId,
          sceneId: sceneIdMap.get(appData.sceneId) ?? appData.sceneId,
          characterId:
            characterIdMap.get(appData.characterId) ?? appData.characterId,
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

/** Read a File (from <input type="file"/>) and parse it as a ShowExport.
 *  Older-version files are forward-migrated to the current schema; future-
 *  version files throw with a clear "refresh Standby" message. */
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
  return migrateShowExport(parsed)
}
