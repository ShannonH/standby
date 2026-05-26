import { type BlockingEntry, type StageZone, STAGE_ZONES } from '@/lib/db'
import type { Contact } from '@/lib/db'

interface BlockingGridProps {
  entry: BlockingEntry
  contacts: Contact[]
  selectedActor: number | null
  onZoneTap: (zone: StageZone) => void
}

const ZONE_LABELS: Record<StageZone, string> = {
  USR: 'US Right',
  USC: 'US Center',
  USL: 'US Left',
  SR: 'Stage Right',
  C: 'Center',
  SL: 'Stage Left',
  DSR: 'DS Right',
  DSC: 'DS Center',
  DSL: 'DS Left',
}

export default function BlockingGrid({
  entry,
  contacts,
  selectedActor,
  onZoneTap,
}: BlockingGridProps) {
  function getActorsInZone(zone: StageZone) {
    return entry.positions
      .filter((p) => p.zone === zone)
      .map((p) => {
        const contact = contacts.find((c) => c.id === p.contactId)
        return {
          contactId: p.contactId,
          name: contact?.name ?? `#${p.contactId}`,
          notes: p.notes,
        }
      })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Page {entry.page || '—'}
        </span>
        {entry.sceneLabel && (
          <span className="text-xs text-muted">· {entry.sceneLabel}</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-surface-border bg-surface-secondary/30 p-3">
        {STAGE_ZONES.map((zone) => {
          const actors = getActorsInZone(zone)
          const hasSelectedActor = actors.some(
            (a) => a.contactId === selectedActor,
          )
          return (
            <button
              key={zone}
              onClick={() => onZoneTap(zone)}
              className={`flex min-h-[5rem] flex-col items-center justify-center rounded-md border p-2 text-center transition-colors ${
                hasSelectedActor
                  ? 'border-accent bg-accent/10'
                  : 'border-surface-border bg-surface hover:bg-surface-secondary'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {ZONE_LABELS[zone]}
              </span>
              {actors.length > 0 && (
                <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                  {actors.map((a) => (
                    <span
                      key={a.contactId}
                      className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${
                        a.contactId === selectedActor
                          ? 'bg-accent text-white'
                          : 'bg-surface-secondary text-foreground'
                      }`}
                    >
                      {a.name.split(' ')[0]}
                    </span>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
      <p className="text-center text-[10px] uppercase tracking-widest text-muted">
        ↓ Audience ↓
      </p>
    </div>
  )
}
