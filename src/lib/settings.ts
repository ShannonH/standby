// User-level UI preferences. Persisted in localStorage via Zustand. Not to
// be confused with Dexie's `settings` table, which stores app-data handles
// (auto-backup, publish folders) — those need to survive across browsers.

export type FontSize = 'sm' | 'md' | 'lg' | 'xl'
export type Theme =
  | 'default'
  | 'stage'
  | 'midnight'
  | 'greenroom'
  | 'marquee'
  | 'rosewood'
export type PaperSize = 'LETTER' | 'A4'

export interface AppSettings {
  fontSize: FontSize
  theme: Theme
  paperSize: PaperSize
}

export const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 'md',
  theme: 'default',
  paperSize: 'LETTER',
}

export const FONT_SIZE_LABELS: Record<FontSize, string> = {
  sm: 'Small',
  md: 'Medium',
  lg: 'Large',
  xl: 'Extra large',
}

export const FONT_SIZE_DESCRIPTIONS: Record<FontSize, string> = {
  sm: '14 px — fits more on screen',
  md: '16 px — browser default',
  lg: '18 px — easier on the eyes',
  xl: '20 px — for booth lighting',
}

export interface ThemeMeta {
  label: string
  description: string
  /** Hex preview for the picker. The real theming uses CSS vars in index.css. */
  swatch: string
  /** Tag line read by the SM — should sound like a stage cue. */
  tagline: string
}

export const THEMES: Record<Theme, ThemeMeta> = {
  default: {
    label: 'Default',
    description: 'Warm grays. Clean, minimal, conventional.',
    swatch: '#1c1917',
    tagline: 'Houselights up.',
  },
  stage: {
    label: 'Stage',
    description: 'Spotlight amber. Theatrical and warm.',
    swatch: '#f59e0b',
    tagline: 'Spot up on Hamlet.',
  },
  midnight: {
    label: 'Midnight',
    description: 'Cool blue. Late-night booth energy.',
    swatch: '#2563eb',
    tagline: 'House to half.',
  },
  greenroom: {
    label: 'Greenroom',
    description: 'Forest green. Between-scenes calm.',
    swatch: '#047857',
    tagline: 'Standby Act Two.',
  },
  marquee: {
    label: 'Marquee',
    description: 'Velvet red. Broadway marquee energy.',
    swatch: '#b91c1c',
    tagline: 'Curtain up.',
  },
  rosewood: {
    label: 'Rosewood',
    description: 'Dusty rose. Vintage rep-house warmth.',
    swatch: '#9f1239',
    tagline: 'Half hour, please.',
  },
}

export const THEME_ORDER: Theme[] = [
  'default',
  'stage',
  'midnight',
  'greenroom',
  'marquee',
  'rosewood',
]

export const PAPER_SIZE_LABELS: Record<PaperSize, string> = {
  LETTER: 'US Letter (8.5 × 11 in)',
  A4: 'A4 (210 × 297 mm)',
}
