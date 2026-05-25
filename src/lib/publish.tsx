import {
  db,
  type Contact,
  type Production,
  type Prop,
  type RehearsalReport,
} from './db'
import ContactSheetPdf from '@/features/contacts/ContactSheetPdf'
import ProductionInfoPdf from '@/features/production/ProductionInfoPdf'
import PropListPdf from '@/features/props/PropListPdf'
import RehearsalReportPdf from '@/features/rehearsals/RehearsalReportPdf'
import { useAppStore } from './store'

/**
 * Per-production "publish" folder. Standby auto-writes the public-facing
 * PDFs there (rehearsal reports, contact sheet, prop list, production info)
 * whenever the underlying data changes. The user picks the folder once,
 * shares it with crew via their cloud-storage app, and from then on the
 * share folder is always close-to-current.
 *
 * **What DOES NOT go in the publish folder:** line notes. Those are per-
 * actor private — crew must not see other actors' line notes. Line notes
 * stay PDF-on-demand via the existing distribute / download flow.
 *
 * **Stale files** stay where they are unless the user clicks "Republish
 * all", which writes everything from scratch. We deliberately don't delete
 * by hand to avoid surprising the user with disappearing files in a folder
 * they shared with cast/crew.
 */

const SETTING_KEY = (productionId: number) =>
  `publish:directoryHandle:${productionId}`

export function isFileSystemAccessSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as { showDirectoryPicker?: unknown })
      .showDirectoryPicker === 'function'
  )
}

interface FSAPermissionHandle {
  queryPermission: (opts: {
    mode: 'read' | 'readwrite'
  }) => Promise<'granted' | 'denied' | 'prompt'>
  requestPermission: (opts: {
    mode: 'read' | 'readwrite'
  }) => Promise<'granted' | 'denied' | 'prompt'>
}

async function verifyPermission(
  handle: FileSystemDirectoryHandle,
): Promise<boolean> {
  const h = handle as unknown as FSAPermissionHandle
  try {
    const current = await h.queryPermission({ mode: 'readwrite' })
    if (current === 'granted') return true
    const requested = await h.requestPermission({ mode: 'readwrite' })
    return requested === 'granted'
  } catch {
    return false
  }
}

export async function pickPublishDirectory(
  productionId: number,
): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) return null
  const picker = (
    window as unknown as {
      showDirectoryPicker: (opts: {
        id?: string
        mode?: 'read' | 'readwrite'
        startIn?:
          | 'desktop'
          | 'documents'
          | 'downloads'
          | 'music'
          | 'pictures'
          | 'videos'
      }) => Promise<FileSystemDirectoryHandle>
    }
  ).showDirectoryPicker
  const handle = await picker({
    id: `standby-publish-${productionId}`,
    mode: 'readwrite',
    startIn: 'documents',
  })
  await db.settings.put({ key: SETTING_KEY(productionId), value: handle })
  return handle
}

export async function getStoredPublishDirectory(
  productionId: number,
): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) return null
  const entry = await db.settings.get(SETTING_KEY(productionId))
  if (!entry?.value) return null
  const handle = entry.value as FileSystemDirectoryHandle
  const ok = await verifyPermission(handle)
  return ok ? handle : null
}

export async function clearPublishDirectory(
  productionId: number,
): Promise<void> {
  await db.settings.delete(SETTING_KEY(productionId))
}

async function getOrCreateSubdir(
  parent: FileSystemDirectoryHandle,
  name: string,
): Promise<FileSystemDirectoryHandle> {
  return parent.getDirectoryHandle(name, { create: true })
}

async function writePdfBlob(
  dir: FileSystemDirectoryHandle,
  filename: string,
  blob: Blob,
): Promise<void> {
  const fh = await dir.getFileHandle(filename, { create: true })
  const writable = await fh.createWritable()
  await writable.write(blob)
  await writable.close()
}

async function generatePdfBlob(element: React.ReactElement): Promise<Blob> {
  const { pdf } = await import('@react-pdf/renderer')
  return pdf(element).toBlob()
}

/** Read the current paperSize preference from the Zustand store outside a
 *  React render — publish functions run from form-submit handlers and the
 *  publish-all button, not from components. */
function currentPaperSize() {
  return useAppStore.getState().settings.paperSize
}

function sanitize(name: string): string {
  return name.replace(/[^A-Za-z0-9\-_ ]/g, '_').trim() || 'untitled'
}

function reportFilename(report: RehearsalReport): string {
  const padded = String(report.dayNumber).padStart(3, '0')
  return `Day-${padded}-${report.date}.pdf`
}

// ─── Single-artifact publishers ───────────────────────────────────────────

export async function publishRehearsalReport(
  handle: FileSystemDirectoryHandle,
  production: Production,
  report: RehearsalReport,
  contacts: Contact[],
): Promise<void> {
  const reportsDir = await getOrCreateSubdir(handle, 'Reports')
  const blob = await generatePdfBlob(
    <RehearsalReportPdf
      production={production}
      report={report}
      contacts={contacts}
      paperSize={currentPaperSize()}
    />,
  )
  await writePdfBlob(reportsDir, reportFilename(report), blob)
}

export async function publishContactSheet(
  handle: FileSystemDirectoryHandle,
  production: Production,
  contacts: Contact[],
): Promise<void> {
  const blob = await generatePdfBlob(
    <ContactSheetPdf
      production={production}
      contacts={contacts}
      paperSize={currentPaperSize()}
    />,
  )
  await writePdfBlob(handle, 'Contact Sheet.pdf', blob)
}

export async function publishPropList(
  handle: FileSystemDirectoryHandle,
  production: Production,
  props: Prop[],
): Promise<void> {
  const blob = await generatePdfBlob(
    <PropListPdf
      production={production}
      props={props}
      paperSize={currentPaperSize()}
    />,
  )
  await writePdfBlob(handle, 'Prop List.pdf', blob)
}

export async function publishProductionInfo(
  handle: FileSystemDirectoryHandle,
  production: Production,
): Promise<void> {
  const blob = await generatePdfBlob(
    <ProductionInfoPdf
      production={production}
      paperSize={currentPaperSize()}
    />,
  )
  await writePdfBlob(handle, 'Production Info.pdf', blob)
}

// ─── "If a folder is connected, write to it" convenience wrappers ────────
//
// Call these from form submit / delete handlers — they no-op silently when
// the user hasn't picked a publish folder.

export async function maybePublishRehearsalReport(
  productionId: number,
  reportId: number,
): Promise<void> {
  const handle = await getStoredPublishDirectory(productionId)
  if (!handle) return
  const [production, report, contacts] = await Promise.all([
    db.productions.get(productionId),
    db.rehearsals.get(reportId),
    db.contacts.where('productionId').equals(productionId).toArray(),
  ])
  if (!production || !report) return
  await publishRehearsalReport(handle, production, report, contacts)
}

export async function maybePublishContactSheet(
  productionId: number,
): Promise<void> {
  const handle = await getStoredPublishDirectory(productionId)
  if (!handle) return
  const [production, contacts] = await Promise.all([
    db.productions.get(productionId),
    db.contacts.where('productionId').equals(productionId).toArray(),
  ])
  if (!production) return
  await publishContactSheet(handle, production, contacts)
}

export async function maybePublishPropList(
  productionId: number,
): Promise<void> {
  const handle = await getStoredPublishDirectory(productionId)
  if (!handle) return
  const [production, props] = await Promise.all([
    db.productions.get(productionId),
    db.props.where('productionId').equals(productionId).toArray(),
  ])
  if (!production) return
  await publishPropList(handle, production, props)
}

export async function maybePublishProductionInfo(
  productionId: number,
): Promise<void> {
  const handle = await getStoredPublishDirectory(productionId)
  if (!handle) return
  const production = await db.productions.get(productionId)
  if (!production) return
  await publishProductionInfo(handle, production)
}

// ─── Full republish ───────────────────────────────────────────────────────

export interface PublishSummary {
  reports: number
  contactSheet: boolean
  propList: boolean
  productionInfo: boolean
  errors: string[]
}

/** Render and write everything from current state, sequentially so we don't
 *  block the main thread for too long at once. Yields between artifacts. */
export async function publishAll(
  productionId: number,
): Promise<PublishSummary> {
  const handle = await getStoredPublishDirectory(productionId)
  if (!handle) {
    throw new Error('No publish folder is connected for this production.')
  }
  const [production, contacts, props, reports] = await Promise.all([
    db.productions.get(productionId),
    db.contacts.where('productionId').equals(productionId).toArray(),
    db.props.where('productionId').equals(productionId).toArray(),
    db.rehearsals.where('productionId').equals(productionId).toArray(),
  ])
  if (!production) {
    throw new Error('Production not found.')
  }

  const summary: PublishSummary = {
    reports: 0,
    contactSheet: false,
    propList: false,
    productionInfo: false,
    errors: [],
  }

  // Yield between writes so the UI stays responsive during a big republish.
  const yieldToUi = () => new Promise<void>((r) => setTimeout(r, 0))

  try {
    await publishProductionInfo(handle, production)
    summary.productionInfo = true
  } catch (err) {
    summary.errors.push(
      `Production info: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
  await yieldToUi()

  try {
    await publishContactSheet(handle, production, contacts)
    summary.contactSheet = true
  } catch (err) {
    summary.errors.push(
      `Contact sheet: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
  await yieldToUi()

  try {
    await publishPropList(handle, production, props)
    summary.propList = true
  } catch (err) {
    summary.errors.push(
      `Prop list: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
  await yieldToUi()

  for (const report of reports) {
    try {
      await publishRehearsalReport(handle, production, report, contacts)
      summary.reports += 1
    } catch (err) {
      summary.errors.push(
        `Day ${report.dayNumber}: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
    await yieldToUi()
  }

  return summary
}

// Re-exported sanitize for tests / callers that need a matching helper.
export { sanitize }
