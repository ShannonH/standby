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
  | 'sampler'
export type PaperSize = 'LETTER' | 'A4'
export type TimeFormat = '12h' | '24h'

export interface AppSettings {
  fontSize: FontSize
  theme: Theme
  paperSize: PaperSize
  /** Whether times like "18:00" render as "6:00p" (12h) or "18:00" (24h).
   *  Defaults to 12h, which is US theater convention. */
  timeFormat: TimeFormat
  /** SM's name. Used for greeting on Today, the email sign-off in
   *  distribution templates, and nowhere else. Empty string = no
   *  personalization. */
  userName: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 'md',
  theme: 'default',
  paperSize: 'LETTER',
  timeFormat: '12h',
  userName: '',
}

export const TIME_FORMAT_LABELS: Record<TimeFormat, string> = {
  '12h': '12-hour (6:00p)',
  '24h': '24-hour (18:00)',
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
  /** Human-readable display + body fonts (for the picker label). */
  displayFont: string
  bodyFont: string
}

export const THEMES: Record<Theme, ThemeMeta> = {
  default: {
    label: 'Default',
    description: 'Warm grays. Broadway-PSM packet aesthetic.',
    swatch: '#1c1917',
    tagline: 'Houselights up.',
    displayFont: 'EB Garamond',
    bodyFont: 'EB Garamond',
  },
  stage: {
    label: 'Stage',
    description: 'Warm cream + spotlight amber. Display serif headings.',
    swatch: '#d97706',
    tagline: 'Spot up on Hamlet.',
    displayFont: 'Playfair Display',
    bodyFont: 'EB Garamond',
  },
  midnight: {
    label: 'Midnight',
    description: 'Cool slate + cyan. Mono uppercase headings — booth console.',
    swatch: '#0891b2',
    tagline: 'House to half.',
    displayFont: 'JetBrains Mono',
    bodyFont: 'Inter',
  },
  greenroom: {
    label: 'Greenroom',
    description: 'Soft sage + emerald. Rounded sans, between-scenes calm.',
    swatch: '#059669',
    tagline: 'Standby Act Two.',
    displayFont: 'Outfit',
    bodyFont: 'Outfit',
  },
  marquee: {
    label: 'Marquee',
    description: 'Cream + crimson + gilded borders. UPPERCASE Playfair.',
    swatch: '#991b1b',
    tagline: 'Curtain up.',
    displayFont: 'Playfair Display',
    bodyFont: 'EB Garamond',
  },
  rosewood: {
    label: 'Rosewood',
    description: 'Dusty rose + burgundy. Italic Cormorant. Vintage parlor.',
    swatch: '#9f1239',
    tagline: 'Half hour, please.',
    displayFont: 'Cormorant Garamond',
    bodyFont: 'Cormorant Garamond',
  },
  sampler: {
    label: 'Sampler',
    description: 'Oatmeal + plum + teal. Handwritten headings, soft rounds. Cross-stitch warmth.',
    swatch: '#7e4a6e',
    tagline: 'Stitch by stitch.',
    displayFont: 'Caveat',
    bodyFont: 'Nunito',
  },
}

export const THEME_ORDER: Theme[] = [
  'default',
  'stage',
  'midnight',
  'greenroom',
  'marquee',
  'rosewood',
  'sampler',
]

export const PAPER_SIZE_LABELS: Record<PaperSize, string> = {
  LETTER: 'US Letter (8.5 × 11 in)',
  A4: 'A4 (210 × 297 mm)',
}
