import { useMemo } from 'react'
import type {
  Character,
  Scene,
  SceneAppearance,
} from '@/lib/db'
import { APPEARANCE_TYPE_GLYPHS } from '@/lib/schemas'

interface Props {
  scenes: Scene[]
  characters: Character[]
  appearances: SceneAppearance[]
  /** Fires when the user clicks a cell. The route opens an editor for
   *  that (scene, character) pair — either an existing appearance to
   *  edit or a fresh one to create. */
  onCellClick: (sceneId: number, characterId: number) => void
}

/**
 * The scene × character matrix. Scenes down the side, characters across
 * the top. Each cell is either blank (character not in scene) or shows
 * a single glyph indicating presence type (● speaking · ♪ singing · ○
 * silent · ~ underscoring). Clicking a cell opens the appearance editor.
 *
 * Sticky first column + first row so the grid stays navigable for big
 * shows (e.g. Pirates with 13 characters × 7 scenes, Les Mis with 30
 * characters × 50 scenes). The whole grid sits in an `overflow-auto`
 * wrapper so it scrolls inside the route layout.
 *
 * Color (background) on populated cells gives a quick "who's on stage
 * a lot" read across the grid. Speaking gets the accent color; singing
 * gets a related-but-distinct color; silent stays muted; underscoring
 * uses a dashed border.
 */
export default function BreakdownMatrix({
  scenes,
  characters,
  appearances,
  onCellClick,
}: Props) {
  // Build a quick lookup: appearanceMap.get(sceneId)?.get(characterId)
  const appearanceMap = useMemo(() => {
    const m = new Map<number, Map<number, SceneAppearance>>()
    for (const a of appearances) {
      let row = m.get(a.sceneId)
      if (!row) {
        row = new Map()
        m.set(a.sceneId, row)
      }
      row.set(a.characterId, a)
    }
    return m
  }, [appearances])

  if (scenes.length === 0 || characters.length === 0) {
    return (
      <div className="rounded border border-dashed border-surface-border p-10 text-center text-sm text-muted">
        {scenes.length === 0 && characters.length === 0
          ? 'Add at least one scene and one character to see the matrix.'
          : scenes.length === 0
            ? 'Add at least one scene to start filling in the matrix.'
            : 'Add at least one character to start filling in the matrix.'}
      </div>
    )
  }

  return (
    <div className="overflow-auto rounded border border-surface-border">
      <table className="text-xs">
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 top-0 z-20 min-w-[12rem] border-b border-r border-surface-border bg-card p-2 text-left font-display text-sm"
            >
              Scene
            </th>
            {characters.map((c) => (
              <th
                key={c.id}
                scope="col"
                className="sticky top-0 z-10 min-w-[5rem] border-b border-surface-border bg-card p-2 text-left align-bottom font-medium"
              >
                <div className="line-clamp-2 leading-tight">{c.name}</div>
                {c.type && (
                  <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">
                    {c.type[0]}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scenes.map((s) => {
            const row = appearanceMap.get(s.id!)
            return (
              <tr key={s.id} className="border-b border-surface-border">
                <th
                  scope="row"
                  className="sticky left-0 z-10 min-w-[12rem] border-r border-surface-border bg-card p-2 text-left align-top font-medium"
                >
                  <div className="font-display text-sm">{s.label}</div>
                  {(s.pageStart || s.pageEnd) && (
                    <div className="text-[10px] text-muted">
                      p.{s.pageStart}
                      {s.pageEnd && s.pageEnd !== s.pageStart
                        ? `–${s.pageEnd}`
                        : ''}
                    </div>
                  )}
                </th>
                {characters.map((c) => {
                  const a = row?.get(c.id!)
                  return (
                    <td
                      key={c.id}
                      className="border-r border-surface-border p-0 text-center"
                    >
                      <button
                        type="button"
                        onClick={() => onCellClick(s.id!, c.id!)}
                        title={a ? appearanceTooltip(a, s, c) : `Mark ${c.name} in ${s.label}`}
                        aria-label={
                          a
                            ? `Edit ${c.name} in ${s.label}: ${a.presence}`
                            : `Mark ${c.name} in ${s.label}`
                        }
                        className={`block h-10 w-full text-center transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[rgb(var(--accent))] ${cellClass(a)}`}
                      >
                        {a ? APPEARANCE_TYPE_GLYPHS[a.presence] : ''}
                      </button>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function appearanceTooltip(
  a: SceneAppearance,
  scene: Scene,
  character: Character,
): string {
  const bits: string[] = [`${character.name} — ${a.presence} in ${scene.label}`]
  if (a.entrancePage) bits.push(`Enters p.${a.entrancePage}`)
  if (a.exitPage) bits.push(`Exits p.${a.exitPage}`)
  if (a.doubling) bits.push(a.doubling)
  return bits.join(' · ')
}

function cellClass(a: SceneAppearance | undefined): string {
  if (!a) return 'text-muted hover:bg-surface-border/30'
  switch (a.presence) {
    case 'speaking':
      return 'bg-[rgb(var(--accent))]/15 text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent))]/25'
    case 'singing':
      // Singing borrows the accent hue but at higher saturation so a
      // musical SM can scan "where are the numbers" quickly.
      return 'bg-[rgb(var(--accent))]/30 text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent))]/40 font-bold'
    case 'silent':
      return 'bg-surface-border/40 text-muted hover:bg-surface-border/60'
    case 'underscoring':
      return 'bg-surface-border/20 text-muted hover:bg-surface-border/40 italic'
  }
}
