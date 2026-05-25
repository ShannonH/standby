import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Themes override these via the body{font-family} and h1-h4{font-family}
        // CSS-var rules in index.css. These Tailwind aliases stay as a
        // fallback for utility-class consumers (e.g. font-serif still works).
        serif: [
          '"EB Garamond"',
          '"Garamond"',
          'Georgia',
          '"Times New Roman"',
          'serif',
        ],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Theme-aware semantic colors. Each <alpha-value> placeholder lets
        // utilities like bg-card/50 work the way you'd expect.
        surface: 'rgb(var(--surface-bg) / <alpha-value>)',
        card: 'rgb(var(--surface-elev) / <alpha-value>)',
        'surface-border': 'rgb(var(--surface-border) / <alpha-value>)',
        muted: 'rgb(var(--text-secondary) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-hover': 'rgb(var(--accent-hover) / <alpha-value>)',
        'on-accent': 'rgb(var(--on-accent) / <alpha-value>)',
      },
      borderRadius: {
        // Themes set --radius for the "neutral" rounded corner size; sharp
        // themes (Midnight) shrink it, soft themes (Greenroom) grow it.
        theme: 'var(--radius)',
      },
    },
  },
  plugins: [],
} satisfies Config
