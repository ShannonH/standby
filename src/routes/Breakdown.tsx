import { useState } from 'react'
import RequiresProduction from '@/components/RequiresProduction'
import {
  Button,
  Field,
  IconButton,
  Input,
  Select,
  Textarea,
  TrashIcon,
} from '@/components/Form'
import AppearanceEditor from '@/features/breakdown/AppearanceEditor'
import BreakdownMatrix from '@/features/breakdown/BreakdownMatrix'
import {
  db,
  type Character,
  type Scene,
} from '@/lib/db'
import {
  useCharacters,
  useContacts,
  useCurrentProduction,
  useNextSceneSequence,
  useSceneAppearances,
  useScenes,
} from '@/lib/hooks'
import { CHARACTER_TYPE_LABELS } from '@/lib/schemas'

export default function BreakdownRoute() {
  return (
    <RequiresProduction>
      <BreakdownInner />
    </RequiresProduction>
  )
}

function BreakdownInner() {
  const production = useCurrentProduction()
  const productionId = production?.id ?? null
  const characters = useCharacters(productionId)
  const scenes = useScenes(productionId)
  const appearances = useSceneAppearances(productionId)
  const cast = useContacts(productionId).filter((c) => c.category === 'cast')
  const nextSequence = useNextSceneSequence(productionId)

  // Open editor for one (scene, character) cell. The matrix passes
  // ids; we look up the actual entities + existing appearance here.
  const [editing, setEditing] = useState<{
    sceneId: number
    characterId: number
  } | null>(null)

  if (!production?.id) return null

  const editingScene = editing
    ? scenes.find((s) => s.id === editing.sceneId)
    : null
  const editingCharacter = editing
    ? characters.find((c) => c.id === editing.characterId)
    : null
  const editingAppearance = editing
    ? appearances.find(
        (a) =>
          a.sceneId === editing.sceneId && a.characterId === editing.characterId,
      )
    : null

  return (
    <section className="mx-auto max-w-7xl space-y-8">
      <header>
        <h2 className="font-display text-3xl">Scene breakdown</h2>
        <p className="mt-1 text-sm text-muted">
          The scenes × characters matrix — who's in what. Click a cell to
          mark presence (speaking / singing / silent / underscoring) and
          enter entrance / exit pages. Doubling notes per cell capture
          quick-change situations.{' '}
          <span className="font-medium">●</span> speaking ·{' '}
          <span className="font-medium">♪</span> singing ·{' '}
          <span className="font-medium">○</span> silent ·{' '}
          <span className="font-medium">~</span> underscoring.
        </p>
      </header>

      <BreakdownMatrix
        scenes={scenes}
        characters={characters}
        appearances={appearances}
        onCellClick={(sceneId, characterId) =>
          setEditing({ sceneId, characterId })
        }
      />

      {editing && editingScene && editingCharacter && (
        <AppearanceEditor
          productionId={production.id}
          scene={editingScene}
          character={editingCharacter}
          existing={editingAppearance ?? undefined}
          onClose={() => setEditing(null)}
        />
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <CharactersPanel
          productionId={production.id}
          characters={characters}
          cast={cast}
        />
        <ScenesPanel
          productionId={production.id}
          scenes={scenes}
          defaultSequence={nextSequence}
        />
      </div>
    </section>
  )
}

// ─── Characters panel ───────────────────────────────────────────────────

function CharactersPanel({
  productionId,
  characters,
  cast,
}: {
  productionId: number
  characters: Character[]
  cast: ReturnType<typeof useContacts>
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<Character['type']>('principal')
  const [playedBy, setPlayedBy] = useState<number | ''>('')

  async function addCharacter() {
    if (!name.trim()) return
    await db.characters.add({
      productionId,
      name: name.trim(),
      type,
      playedByContactId: playedBy === '' ? undefined : playedBy,
    } as Character)
    setName('')
    setPlayedBy('')
    setAdding(false)
  }

  function contactName(id?: number): string {
    if (id === undefined) return ''
    return cast.find((c) => c.id === id)?.name ?? '(removed)'
  }

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-xl">Characters</h3>
        <Button variant="secondary" onClick={() => setAdding(!adding)}>
          {adding ? 'Cancel' : '+ Add character'}
        </Button>
      </div>

      {adding && (
        <div className="space-y-3 rounded border border-surface-border bg-card p-3">
          <Field label="Role name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mabel"
              autoFocus
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type" optional>
              <Select
                value={type ?? 'principal'}
                onChange={(e) => setType(e.target.value as Character['type'])}
              >
                {(
                  Object.entries(CHARACTER_TYPE_LABELS) as [
                    NonNullable<Character['type']>,
                    string,
                  ][]
                ).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Played by" optional>
              <Select
                value={playedBy === '' ? '' : String(playedBy)}
                onChange={(e) =>
                  setPlayedBy(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              >
                <option value="">— Unassigned —</option>
                {cast.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex justify-end">
            <Button onClick={addCharacter}>Save character</Button>
          </div>
        </div>
      )}

      {characters.length === 0 ? (
        <p className="rounded border border-dashed border-surface-border p-4 text-center text-sm text-muted">
          No characters yet. Add the principal roles first — the matrix
          will populate as you mark their presence in each scene.
        </p>
      ) : (
        <ul className="divide-y divide-surface-border rounded border border-surface-border">
          {characters.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 p-2 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted">
                  {c.type && CHARACTER_TYPE_LABELS[c.type]}
                  {c.playedByContactId
                    ? ` · ${contactName(c.playedByContactId)}`
                    : ''}
                  {c.notes ? ` · ${c.notes}` : ''}
                </p>
              </div>
              <IconButton
                tone="danger"
                aria-label={`Delete character ${c.name}`}
                onClick={async () => {
                  if (c.id === undefined) return
                  if (
                    !window.confirm(
                      `Delete "${c.name}" and remove from all scenes?`,
                    )
                  )
                    return
                  await db.transaction(
                    'rw',
                    [db.characters, db.sceneAppearances],
                    async () => {
                      await db.sceneAppearances
                        .where('characterId')
                        .equals(c.id!)
                        .delete()
                      await db.characters.delete(c.id!)
                    },
                  )
                }}
              >
                <TrashIcon />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ─── Scenes panel ───────────────────────────────────────────────────────

function ScenesPanel({
  productionId,
  scenes,
  defaultSequence,
}: {
  productionId: number
  scenes: Scene[]
  defaultSequence: number
}) {
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [act, setAct] = useState('')
  const [pageStart, setPageStart] = useState('')
  const [pageEnd, setPageEnd] = useState('')
  const [location, setLocation] = useState('')
  const [numberName, setNumberName] = useState('')
  const [notes, setNotes] = useState('')

  async function addScene() {
    if (!label.trim()) return
    await db.scenes.add({
      productionId,
      sequence: defaultSequence,
      label: label.trim(),
      act: act.trim() || undefined,
      pageStart: pageStart.trim() || undefined,
      pageEnd: pageEnd.trim() || undefined,
      location: location.trim() || undefined,
      numberName: numberName.trim() || undefined,
      notes: notes.trim() || undefined,
    } as Scene)
    setLabel('')
    setAct('')
    setPageStart('')
    setPageEnd('')
    setLocation('')
    setNumberName('')
    setNotes('')
    setAdding(false)
  }

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-xl">Scenes</h3>
        <Button variant="secondary" onClick={() => setAdding(!adding)}>
          {adding ? 'Cancel' : '+ Add scene'}
        </Button>
      </div>

      {adding && (
        <div className="space-y-3 rounded border border-surface-border bg-card p-3">
          <Field label="Label" required hint="e.g. I.1, Act 2 Scene 3, Pirate Cove">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Act" optional>
              <Input
                value={act}
                onChange={(e) => setAct(e.target.value)}
                placeholder="e.g. 1, II"
              />
            </Field>
            <Field label="Musical number" optional>
              <Input
                value={numberName}
                onChange={(e) => setNumberName(e.target.value)}
                placeholder="e.g. Modern Major-General"
              />
            </Field>
            <Field label="Page start" optional>
              <Input
                value={pageStart}
                onChange={(e) => setPageStart(e.target.value)}
                placeholder="e.g. 12"
              />
            </Field>
            <Field label="Page end" optional>
              <Input
                value={pageEnd}
                onChange={(e) => setPageEnd(e.target.value)}
                placeholder="e.g. 20"
              />
            </Field>
          </div>
          <Field label="Location" optional>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Forest, Major-General's estate"
            />
          </Field>
          <Field label="Notes" optional>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </Field>
          <div className="flex justify-end">
            <Button onClick={addScene}>Save scene</Button>
          </div>
        </div>
      )}

      {scenes.length === 0 ? (
        <p className="rounded border border-dashed border-surface-border p-4 text-center text-sm text-muted">
          No scenes yet. Add scenes (or musical numbers) in performance
          order — they'll form the matrix rows.
        </p>
      ) : (
        <ul className="divide-y divide-surface-border rounded border border-surface-border">
          {scenes.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2 p-2 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {s.label}
                  {s.numberName && (
                    <span className="ml-1 text-muted">
                      — {s.numberName}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted">
                  {[
                    s.act && `Act ${s.act}`,
                    s.pageStart && `p.${s.pageStart}${s.pageEnd && s.pageEnd !== s.pageStart ? `–${s.pageEnd}` : ''}`,
                    s.location,
                    s.runningTimeMin && `${s.runningTimeMin}m`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <IconButton
                tone="danger"
                aria-label={`Delete scene ${s.label}`}
                onClick={async () => {
                  if (s.id === undefined) return
                  if (
                    !window.confirm(
                      `Delete scene "${s.label}" and all its appearance entries?`,
                    )
                  )
                    return
                  await db.transaction(
                    'rw',
                    [db.scenes, db.sceneAppearances],
                    async () => {
                      await db.sceneAppearances
                        .where('sceneId')
                        .equals(s.id!)
                        .delete()
                      await db.scenes.delete(s.id!)
                    },
                  )
                }}
              >
                <TrashIcon />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
