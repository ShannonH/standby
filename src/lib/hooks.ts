import { useLiveQuery } from 'dexie-react-hooks'
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
import { useAppStore } from './store'

export function useProductions(): Production[] {
  return useLiveQuery(() => db.productions.orderBy('name').toArray(), []) ?? []
}

export function useCurrentProduction(): Production | undefined {
  const currentProductionId = useAppStore((s) => s.currentProductionId)
  return useLiveQuery(async () => {
    if (currentProductionId === null) return undefined
    return db.productions.get(currentProductionId)
  }, [currentProductionId])
}

export function useContacts(productionId: number | null | undefined): Contact[] {
  return (
    useLiveQuery(async () => {
      if (productionId === null || productionId === undefined) {
        return [] as Contact[]
      }
      return db.contacts.where('productionId').equals(productionId).sortBy('name')
    }, [productionId]) ?? []
  )
}

export function useContactGroups(
  productionId: number | null | undefined,
): ContactGroup[] {
  return (
    useLiveQuery(async () => {
      if (productionId === null || productionId === undefined) {
        return [] as ContactGroup[]
      }
      return db.contactGroups
        .where('productionId')
        .equals(productionId)
        .sortBy('name')
    }, [productionId]) ?? []
  )
}

export function useRehearsals(
  productionId: number | null | undefined,
): RehearsalReport[] {
  return (
    useLiveQuery(async () => {
      if (productionId === null || productionId === undefined) {
        return [] as RehearsalReport[]
      }
      // Sort descending — most recent first for the list view.
      const reports = await db.rehearsals
        .where('productionId')
        .equals(productionId)
        .toArray()
      return reports.sort((a, b) =>
        b.date.localeCompare(a.date) || b.dayNumber - a.dayNumber,
      )
    }, [productionId]) ?? []
  )
}

export function useRehearsal(
  reportId: number | null | undefined,
): RehearsalReport | undefined {
  return useLiveQuery(async () => {
    if (reportId === null || reportId === undefined) return undefined
    return db.rehearsals.get(reportId)
  }, [reportId])
}

/** Next available day-number for a production (max + 1, or 1 if none). */
export function useNextDayNumber(
  productionId: number | null | undefined,
): number {
  return (
    useLiveQuery(async () => {
      if (productionId === null || productionId === undefined) return 1
      const reports = await db.rehearsals
        .where('productionId')
        .equals(productionId)
        .toArray()
      if (reports.length === 0) return 1
      return Math.max(...reports.map((r) => r.dayNumber)) + 1
    }, [productionId]) ?? 1
  )
}

export function useDailyCalls(
  productionId: number | null | undefined,
): DailyCall[] {
  return (
    useLiveQuery(async () => {
      if (productionId === null || productionId === undefined) {
        return [] as DailyCall[]
      }
      const calls = await db.dailyCalls
        .where('productionId')
        .equals(productionId)
        .toArray()
      // Most-recent date first; within same date, highest version first.
      return calls.sort(
        (a, b) =>
          b.date.localeCompare(a.date) || b.version - a.version,
      )
    }, [productionId]) ?? []
  )
}

export function useDailyCall(
  callId: number | null | undefined,
): DailyCall | undefined {
  return useLiveQuery(async () => {
    if (callId === null || callId === undefined) return undefined
    return db.dailyCalls.get(callId)
  }, [callId])
}

/** Next version number to use for a given date, or 1 if none exists yet. */
export function useNextCallVersion(
  productionId: number | null | undefined,
  date: string,
): number {
  return (
    useLiveQuery(async () => {
      if (productionId === null || productionId === undefined) return 1
      if (!date) return 1
      const calls = await db.dailyCalls
        .where('productionId')
        .equals(productionId)
        .toArray()
      const sameDate = calls.filter((c) => c.date === date)
      if (sameDate.length === 0) return 1
      return Math.max(...sameDate.map((c) => c.version)) + 1
    }, [productionId, date]) ?? 1
  )
}

export function useTrackingEntries(
  productionId: number | null | undefined,
): TrackingEntry[] {
  return (
    useLiveQuery(async () => {
      if (productionId === null || productionId === undefined) {
        return [] as TrackingEntry[]
      }
      const entries = await db.tracking
        .where('productionId')
        .equals(productionId)
        .toArray()
      return entries.sort((a, b) => a.sequence - b.sequence)
    }, [productionId]) ?? []
  )
}

/** Next sequence number to use for a new tracking entry in this production. */
export function useNextTrackingSequence(
  productionId: number | null | undefined,
): number {
  return (
    useLiveQuery(async () => {
      if (productionId === null || productionId === undefined) return 10
      const entries = await db.tracking
        .where('productionId')
        .equals(productionId)
        .toArray()
      if (entries.length === 0) return 10
      // Step by 10 so manually inserting between two rows is easy.
      return Math.max(...entries.map((e) => e.sequence)) + 10
    }, [productionId]) ?? 10
  )
}

export function useSendLog(
  productionId: number | null | undefined,
  limit = 50,
): SendLogEntry[] {
  return (
    useLiveQuery(async () => {
      if (productionId === null || productionId === undefined) {
        return [] as SendLogEntry[]
      }
      const entries = await db.sendLog
        .where('productionId')
        .equals(productionId)
        .toArray()
      return entries
        .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
        .slice(0, limit)
    }, [productionId, limit]) ?? []
  )
}

export function useProps(productionId: number | null | undefined): Prop[] {
  return (
    useLiveQuery(async () => {
      if (productionId === null || productionId === undefined) {
        return [] as Prop[]
      }
      return db.props
        .where('productionId')
        .equals(productionId)
        .sortBy('name')
    }, [productionId]) ?? []
  )
}

export function useLineNotes(
  productionId: number | null | undefined,
): LineNote[] {
  return (
    useLiveQuery(async () => {
      if (productionId === null || productionId === undefined) {
        return [] as LineNote[]
      }
      const notes = await db.lineNotes
        .where('productionId')
        .equals(productionId)
        .toArray()
      // Sort: undelivered first, then by date descending, then by page.
      return notes.sort((a, b) => {
        const aDelivered = a.delivered ? 1 : 0
        const bDelivered = b.delivered ? 1 : 0
        if (aDelivered !== bDelivered) return aDelivered - bDelivered
        if (a.rehearsalDate !== b.rehearsalDate) {
          return b.rehearsalDate.localeCompare(a.rehearsalDate)
        }
        return a.page.localeCompare(b.page, undefined, { numeric: true })
      })
    }, [productionId]) ?? []
  )
}
