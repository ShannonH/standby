import { useEffect, useState } from 'react'
import { Button, Field, IconButton, Input, Select, Textarea, TrashIcon } from '@/components/Form'
import {
  db,
  type Character,
  type Scene,
  type SceneAppearance,
} from '@/lib/db'
import {
  APPEARANCE_TYPE_LABELS,
  appearanceTypeSchema,
} from '@/lib/schemas'

interface Props {
  productionId: number
  scene: Scene
  character: Character
  /** Existing appearance to edit, or undefined to create a new one. */
  existing?: SceneAppearance
  onClose: () => void
}

/**
 * Modal dialog for editing a single matrix cell. Shows the (scene,
 * character) pair as context and lets the SM set presence type,
 * entrance/exit pages, and a quick-change / doubling note.
 *
 * Save is a tap on "Save", not autosave — the modal is a focused
 * intent-to-change moment. Delete is allowed for existing appearances.
 *
 * Focus moves to the presence radio on open; pressing Escape closes
 * without saving.
 */
export default function AppearanceEditor({
  productionId,
  scene,
  character,
  existing,
  onClose,
}: Props) {
  const [presence, setPresence] = useState<
    SceneAppearance['presence']
  >(existing?.presence ?? 'speaking')
  const [entrancePage, setEntrancePage] = useState(existing?.entrancePage ?? '')
  const [exitPage, setExitPage] = useState(existing?.exitPage ?? '')
  const [doubling, setDoubling] = useState(existing?.doubling ?? '')
  const [busy, setBusy] = useState(false)

  // Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function save() {
    setBusy(true)
    try {
      const payload: Omit<SceneAppearance, 'id'> = {
        productionId,
        sceneId: scene.id!,
        characterId: character.id!,
        presence,
        entrancePage: entrancePage || undefined,
        exitPage: exitPage || undefined,
        doubling: doubling || undefined,
      }
      if (existing?.id !== undefined) {
        await db.sceneAppearances.update(existing.id, payload)
      } else {
        await db.sceneAppearances.add(payload as SceneAppearance)
      }
      onClose()
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!existing?.id) return onClose()
    if (
      !window.confirm(`Remove ${character.name} from ${scene.label}?`)
    )
      return
    setBusy(true)
    try {
      await db.sceneAppearances.delete(existing.id)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${character.name} in ${scene.label}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="animate-backdrop-fade-in absolute inset-0 bg-black/60"
      />
      <div className="relative z-10 w-full max-w-md space-y-4 rounded-lg border border-surface-border bg-card p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted">
              {scene.label}
              {scene.act && ` · Act ${scene.act}`}
            </p>
            <h3 className="font-display text-xl">{character.name}</h3>
            {character.notes && (
              <p className="text-xs text-muted">{character.notes}</p>
            )}
          </div>
          {existing && (
            <IconButton
              tone="danger"
              aria-label={`Remove ${character.name} from ${scene.label}`}
              onClick={remove}
              disabled={busy}
            >
              <TrashIcon />
            </IconButton>
          )}
        </div>

        <Field label="Presence" required>
          <Select
            value={presence}
            onChange={(e) =>
              setPresence(
                appearanceTypeSchema.parse(e.target.value),
              )
            }
            autoFocus
          >
            {(
              Object.entries(APPEARANCE_TYPE_LABELS) as [
                SceneAppearance['presence'],
                string,
              ][]
            ).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Entrance page" optional>
            <Input
              value={entrancePage}
              onChange={(e) => setEntrancePage(e.target.value)}
              placeholder="e.g. 17"
            />
          </Field>
          <Field label="Exit page" optional>
            <Input
              value={exitPage}
              onChange={(e) => setExitPage(e.target.value)}
              placeholder="e.g. 24"
            />
          </Field>
        </div>

        <Field
          label="Doubling / quick-change note"
          optional
          hint="Free-form. e.g. 'Quick change from Hippolyta in I.1', 'Bottom transforms into the ass mid-scene'."
        >
          <Textarea
            value={doubling}
            onChange={(e) => setDoubling(e.target.value)}
            rows={2}
          />
        </Field>

        <div className="flex justify-end gap-2 border-t border-surface-border pt-3">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}
