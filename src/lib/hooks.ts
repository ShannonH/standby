import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Contact, type ContactGroup, type Production } from './db'
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
