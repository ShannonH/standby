import { describe, expect, it } from 'vitest'
import { relativeTime } from './relative-time'

const NOW = new Date('2026-07-15T12:00:00.000Z')

function isoSecondsAgo(seconds: number): string {
  return new Date(NOW.getTime() - seconds * 1000).toISOString()
}

describe('relativeTime', () => {
  it('reports "just now" for very recent timestamps', () => {
    expect(relativeTime(isoSecondsAgo(0), NOW)).toBe('just now')
    expect(relativeTime(isoSecondsAgo(60), NOW)).toBe('just now')
  })

  it('reports minutes ago under an hour', () => {
    expect(relativeTime(isoSecondsAgo(60 * 5), NOW)).toBe('5m ago')
    expect(relativeTime(isoSecondsAgo(60 * 45), NOW)).toBe('45m ago')
  })

  it('reports hours ago under a day', () => {
    expect(relativeTime(isoSecondsAgo(60 * 60 * 3), NOW)).toBe('3h ago')
  })

  it('says "yesterday" between 24-48 hours ago', () => {
    expect(relativeTime(isoSecondsAgo(60 * 60 * 30), NOW)).toBe('yesterday')
  })

  it('reports N days for the rest of the week', () => {
    expect(relativeTime(isoSecondsAgo(60 * 60 * 24 * 3), NOW)).toBe(
      '3 days ago',
    )
  })

  it('falls back to a date for older timestamps', () => {
    // 30 days ago — should render a date string. Within the year, no
    // year suffix.
    const result = relativeTime(isoSecondsAgo(60 * 60 * 24 * 30), NOW)
    expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/)
  })

  it('includes the year for very old timestamps', () => {
    // 400 days ago — more than ~10 months → year shown.
    const result = relativeTime(isoSecondsAgo(60 * 60 * 24 * 400), NOW)
    expect(result).toMatch(/\d{4}/)
  })

  it('returns the input on unparseable strings', () => {
    expect(relativeTime('not-a-date', NOW)).toBe('not-a-date')
  })
})
