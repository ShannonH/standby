import { useMemo, useRef, useState } from 'react'
import { Button, Field, Select } from '@/components/Form'
import RequiresProduction from '@/components/RequiresProduction'
import TrackingEntryForm from '@/features/tracking/TrackingEntryForm'
import TrackingTable from '@/features/tracking/TrackingTable'
import { db, type Contact, type TrackingEntry } from '@/lib/db'
import {
  useContacts,
  useCurrentProduction,
  useNextTrackingSequence,
  useTrackingEntries,
} from '@/lib/hooks'
import { useAppStore } from '@/lib/store'

export default function TrackingRoute() {
  return (
    <RequiresProduction>
      <TrackingInner />
    </RequiresProduction>
  )
}

type Mode =
  | { kind: 'view' }
  | { kind: 'new' }
  | { kind: 'edit'; id: number }

function TrackingInner() {
  const production = useCurrentProduction()
  const productionId = production?.id ?? null
  const contacts = useContacts(productionId)
  const entries = useTrackingEntries(productionId)
  const nextSeq = useNextTrackingSequence(productionId)
  const [mode, setMode] = useState<Mode>({ kind: 'view' })
  const [perActorId, setPerActorId] = useState<number | ''>('')
  const [quickAdd, setQuickAdd] = useState(false)
  const [showCsvImport, setShowCsvImport] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [csvError, setCsvError] = useState<string | null>(null)
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cast + crew can both appear in tracking entries (crew for the yellow
  // rows, cast for entries/exits) — show both in the who-picker.
  const trackable = useMemo(
    () =>
      contacts.filter(
        (c) => c.category === 'cast' || c.category === 'crew',
      ),
    [contacts],
  )

  const editing = useMemo<TrackingEntry | undefined>(
    () =>
      mode.kind === 'edit' ? entries.find((e) => e.id === mode.id) : undefined,
    [mode, entries],
  )

  const lastEntry = entries[entries.length - 1]

  const trackedActors: Contact[] = useMemo(() => {
    const ids = new Set<number>()
    for (const e of entries) for (const id of e.contactIds) ids.add(id)
    return trackable.filter((c) => c.id !== undefined && ids.has(c.id))
  }, [entries, trackable])

  if (!production?.id) return null

  // ─── Duplicate handler ──────────────────────────────────────────────────────
  async function handleDuplicate(entry: TrackingEntry) {
    if (!production?.id) return
    const maxSeq = entries.length > 0 ? Math.max(...entries.map((e) => e.sequence)) : 0
    const newEntry: Omit<TrackingEntry, 'id'> = {
      productionId: production.id,
      sequence: maxSeq + 10,
      page: entry.page,
      kind: entry.kind,
      contactIds: [...entry.contactIds],
      whoOverride: entry.whoOverride,
      what: entry.what,
      where: entry.where,
      sceneLabel: entry.sceneLabel,
      notes: entry.notes,
    }
    await db.tracking.add(newEntry as TrackingEntry)
  }

  // ─── CSV Import ─────────────────────────────────────────────────────────────
  // Expected format: page, kind, who, what, where, sceneLabel, notes
  // "who" matches contact names (comma-separated within the cell) or is a whoOverride.

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCsvText(reader.result as string)
      setCsvError(null)
      setCsvSuccess(null)
    }
    reader.readAsText(file)
  }

  async function importCsv() {
    if (!production?.id) return
    setCsvError(null)
    setCsvSuccess(null)

    const lines = csvText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    if (lines.length === 0) {
      setCsvError('No data to import.')
      return
    }

    // Skip header row if it looks like one (starts with "page" case-insensitive)
    const firstLine = lines[0]!.toLowerCase()
    const startIdx = firstLine.startsWith('page') ? 1 : 0

    const contactNameMap = new Map<string, number>()
    for (const c of trackable) {
      if (c.id !== undefined) {
        contactNameMap.set(c.name.toLowerCase().trim(), c.id)
      }
    }

    const currentMax = entries.length > 0 ? Math.max(...entries.map((e) => e.sequence)) : 0
    const newEntries: Omit<TrackingEntry, 'id'>[] = []
    const errors: string[] = []

    for (let i = startIdx; i < lines.length; i++) {
      const cells = parseCsvLine(lines[i]!)
      if (cells.length < 5) {
        errors.push(`Row ${i + 1}: expected at least 5 columns (page, kind, who, what, where), got ${cells.length}`)
        continue
      }

      const [pageRaw, kindRaw, whoRaw, whatRaw, whereRaw, sceneLabelRaw, notesRaw] = cells
      const page = pageRaw?.trim() ?? ''
      const kindStr = kindRaw?.trim().toLowerCase() ?? 'entry'
      const who = whoRaw?.trim() ?? ''
      const what = whatRaw?.trim() ?? ''
      const where = whereRaw?.trim() ?? ''
      const sceneLabel = sceneLabelRaw?.trim() || undefined
      const notes = notesRaw?.trim() || undefined

      // Validate kind
      let kind: TrackingEntry['kind'] = 'entry'
      if (kindStr === 'scene-shift' || kindStr === 'scene shift' || kindStr === 'shift') {
        kind = 'scene-shift'
      } else if (kindStr === 'crew') {
        kind = 'crew'
      }

      // Resolve contacts
      const contactIds: number[] = []
      let whoOverride: string | undefined
      if (who) {
        const names = who.split(',').map((n) => n.trim().toLowerCase())
        for (const name of names) {
          const id = contactNameMap.get(name)
          if (id !== undefined) {
            contactIds.push(id)
          } else {
            // If any name can't be resolved, use whoOverride for the whole cell
            whoOverride = who
            break
          }
        }
        // If we resolved all names, whoOverride stays undefined
        if (whoOverride) {
          // Clear partially-resolved contactIds
          contactIds.length = 0
        }
      }

      newEntries.push({
        productionId: production.id,
        sequence: currentMax + (newEntries.length + 1) * 10,
        page,
        kind,
        contactIds,
        whoOverride,
        what,
        where,
        sceneLabel,
        notes,
      })
    }

    if (errors.length > 0 && newEntries.length === 0) {
      setCsvError(errors.join('\n'))
      return
    }

    if (newEntries.length > 0) {
      await db.tracking.bulkAdd(newEntries as TrackingEntry[])
    }

    const msg = `Imported ${newEntries.length} entries.`
    const errMsg = errors.length > 0 ? ` ${errors.length} rows skipped.` : ''
    setCsvSuccess(msg + errMsg)
    if (errors.length > 0) setCsvError(errors.join('\n'))
    setCsvText('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ─── PDF exports ────────────────────────────────────────────────────────────

  async function downloadMasterPdf() {
    if (!production) return
    const settings = useAppStore.getState().settings
    const [{ pdf }, { default: TrackingPdf }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/features/tracking/TrackingPdf'),
    ])
    const blob = await pdf(
      <TrackingPdf
        production={production}
        entries={entries}
        contacts={contacts}
        paperSize={settings.paperSize}
      />,
    ).toBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${production.name.replace(/[^a-z0-9]/gi, '_')}-master-tracking.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async function downloadPerActorPdf() {
    if (!production || perActorId === '') return
    const actor = trackable.find((c) => c.id === perActorId)
    if (!actor) return
    const settings = useAppStore.getState().settings
    // Include entries the actor is in, plus scene-shifts for structural
    // context — same rule as the in-app filter view.
    const actorEntries = entries.filter(
      (e) => e.kind === 'scene-shift' || e.contactIds.includes(perActorId),
    )
    const [{ pdf }, { default: PerActorTrackPdf }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/features/tracking/PerActorTrackPdf'),
    ])
    const blob = await pdf(
      <PerActorTrackPdf
        production={production}
        actor={actor}
        entries={actorEntries}
        paperSize={settings.paperSize}
      />,
    ).toBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const safeActor = actor.name.replace(/[^a-z0-9]/gi, '_')
    link.download = `${production.name.replace(/[^a-z0-9]/gi, '_')}-track-${safeActor}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <section className="mx-auto max-w-6xl space-y-8">
      <header>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl">
              Master tracking
            </h2>
            <p className="mt-1 text-sm text-muted">
              For <span className="font-medium">{production.name}</span>. One
              row per event — entrances, exits, crossovers, crew hand-offs,
              scene shifts. Filter by actor below for a quick personal-track
              read, or generate a per-actor PDF in <em>Exports</em>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {mode.kind === 'view' && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setShowCsvImport((v) => !v)}
                >
                  {showCsvImport ? 'Hide import' : 'CSV import'}
                </Button>
                <Button onClick={() => setMode({ kind: 'new' })}>
                  + Add tracking entry
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── CSV Import panel ──────────────────────────────────────────── */}
      {showCsvImport && mode.kind === 'view' && (
        <div className="space-y-3 rounded border border-surface-border bg-surface-secondary/30 p-4">
          <h3 className="font-display text-lg">CSV Import</h3>
          <p className="text-sm text-muted">
            Paste or upload a CSV with columns:{' '}
            <code className="rounded bg-surface-secondary px-1 font-mono text-xs">
              page, kind, who, what, where, sceneLabel, notes
            </code>
            . The <em>kind</em> column accepts "entry", "scene-shift", or
            "crew". The <em>who</em> column should contain contact names
            (comma-separated if multiple) — unmatched names become a
            "who override" string.
          </p>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleCsvFile}
              className="text-sm"
            />
            <span className="text-xs text-muted">or paste below ↓</span>
          </div>
          <textarea
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value)
              setCsvError(null)
              setCsvSuccess(null)
            }}
            rows={6}
            className="w-full rounded border border-surface-border bg-surface p-2 font-mono text-xs"
            placeholder={`page,kind,who,what,where,sceneLabel,notes\n11,entry,"Alice, Bob",ENT,SR,,\n11,crew,Deck SM,set chair,USL,,quiet`}
          />
          {csvError && (
            <pre className="max-h-24 overflow-auto rounded bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">
              {csvError}
            </pre>
          )}
          {csvSuccess && (
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              {csvSuccess}
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={importCsv} disabled={csvText.trim().length === 0}>
              Import
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCsvImport(false)
                setCsvText('')
                setCsvError(null)
                setCsvSuccess(null)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ─── New entry form ────────────────────────────────────────────── */}
      {mode.kind === 'new' && (
        <div className="space-y-3 rounded border border-surface-border p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-xl">New entry</h3>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={quickAdd}
                onChange={(e) => setQuickAdd(e.target.checked)}
                className="rounded border-surface-border"
              />
              Quick-add mode
            </label>
          </div>
          <TrackingEntryForm
            productionId={production.id}
            contacts={trackable}
            defaultSequence={nextSeq}
            defaultPage={lastEntry?.page}
            defaultWhere={lastEntry?.where}
            quickAdd={quickAdd}
            onSaved={() => {
              // In quick-add mode, form stays open (it resets itself internally)
              if (!quickAdd) {
                setMode({ kind: 'view' })
              }
            }}
            onCancel={() => {
              setMode({ kind: 'view' })
              setQuickAdd(false)
            }}
          />
        </div>
      )}

      {/* ─── Edit form ─────────────────────────────────────────────────── */}
      {mode.kind === 'edit' && editing && (
        <div className="space-y-3 rounded border border-surface-border p-4">
          <h3 className="font-display text-xl">Edit entry</h3>
          <TrackingEntryForm
            productionId={production.id}
            entry={editing}
            contacts={trackable}
            defaultSequence={editing.sequence}
            onSaved={() => setMode({ kind: 'view' })}
            onCancel={() => setMode({ kind: 'view' })}
          />
        </div>
      )}

      <TrackingTable
        entries={entries}
        contacts={trackable}
        onEdit={(id) => setMode({ kind: 'edit', id })}
        onDuplicate={handleDuplicate}
      />

      {/* ─── Exports ───────────────────────────────────────────────────── */}
      {entries.length > 0 && (
        <section className="space-y-3 border-t border-surface-border pt-8">
          <h3 className="font-display text-xl">Exports</h3>
          <p className="text-sm text-muted">
            Master sheet for the booth and ASMs. Per-actor PDFs are
            auto-derived from the same data — each actor sees only their
            entries plus scene-shift markers for context. (Auto-published
            into the share folder under a "Tracking/" subfolder when a
            publish folder is connected.)
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <Button onClick={downloadMasterPdf}>
              Download master tracking (PDF)
            </Button>
            <Field label="Per-actor PDF">
              <Select
                value={perActorId}
                onChange={(e) =>
                  setPerActorId(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              >
                <option value="">Pick an actor…</option>
                {trackedActors.map((c) => {
                  const count = entries.filter((e) =>
                    e.contactIds.includes(c.id!),
                  ).length
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({count})
                    </option>
                  )
                })}
              </Select>
            </Field>
            <Button
              variant="secondary"
              onClick={downloadPerActorPdf}
              disabled={perActorId === ''}
            >
              Download actor track
            </Button>
          </div>
        </section>
      )}
    </section>
  )
}

// ─── CSV parser ─────────────────────────────────────────────────────────────
// Handles quoted fields with commas inside. Simple and sufficient.

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (inQuotes) {
      if (ch === '"') {
        // Peek ahead for escaped quote
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',' || ch === '\t') {
        cells.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  cells.push(current)
  return cells
}
