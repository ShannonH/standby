import { describe, expect, it } from 'vitest'
import type { Production } from './db'
import {
  countdownPhrase,
  daysBetween,
  milestonesFor,
  phaseInfo,
  relativeDayPhrase,
  todayISO,
} from './today'

function makeProduction(overrides: Partial<Production> = {}): Production {
  return {
    name: 'Test Show',
    type: 'play',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('today: daysBetween', () => {
  it('returns 0 for same day', () => {
    expect(daysBetween('2026-07-15', '2026-07-15')).toBe(0)
  })
  it('positive when b is later', () => {
    expect(daysBetween('2026-07-15', '2026-07-25')).toBe(10)
  })
  it('negative when b is earlier', () => {
    expect(daysBetween('2026-07-25', '2026-07-15')).toBe(-10)
  })
  it('crosses a month boundary correctly', () => {
    expect(daysBetween('2026-07-30', '2026-08-02')).toBe(3)
  })
  it('crosses a DST boundary without off-by-one (spring)', () => {
    // 2026 US spring-forward is 2026-03-08
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2)
  })
})

describe('today: todayISO', () => {
  it('formats a known date as yyyy-mm-dd in local time', () => {
    // Pick a noon UTC moment to avoid TZ flakiness near midnight
    const d = new Date(2026, 6, 15, 12, 0, 0) // July is month index 6
    expect(todayISO(d)).toBe('2026-07-15')
  })
})

describe('today: milestonesFor', () => {
  it('returns empty when no dates set', () => {
    expect(milestonesFor(makeProduction())).toHaveLength(0)
  })
  it('drops unset dates and sorts chronologically', () => {
    const p = makeProduction({
      opening: '2026-07-25',
      firstRehearsal: '2026-06-22',
      closing: '2026-08-02',
    })
    const ms = milestonesFor(p)
    expect(ms.map((m) => m.key)).toEqual([
      'firstRehearsal',
      'opening',
      'closing',
    ])
  })
})

describe('today: phaseInfo', () => {
  const dates = {
    firstRehearsal: '2026-06-22',
    techStart: '2026-07-16',
    firstPreview: '2026-07-23',
    opening: '2026-07-25',
    closing: '2026-08-02',
  }

  it('undated when no dates set', () => {
    expect(phaseInfo(makeProduction()).phase).toBe('undated')
  })

  it('pre-production before first rehearsal', () => {
    const info = phaseInfo(makeProduction(dates), '2026-06-01')
    expect(info.phase).toBe('pre-production')
    expect(info.nextMilestone?.key).toBe('firstRehearsal')
    expect(info.daysUntilNext).toBe(21)
  })

  it('rehearsal between first reh and tech start', () => {
    expect(phaseInfo(makeProduction(dates), '2026-06-22').phase).toBe(
      'rehearsal',
    )
    expect(phaseInfo(makeProduction(dates), '2026-07-10').phase).toBe(
      'rehearsal',
    )
  })

  it('tech between tech start and first preview', () => {
    expect(phaseInfo(makeProduction(dates), '2026-07-16').phase).toBe('tech')
    expect(phaseInfo(makeProduction(dates), '2026-07-22').phase).toBe('tech')
  })

  it('previews between first preview and opening', () => {
    expect(phaseInfo(makeProduction(dates), '2026-07-23').phase).toBe(
      'previews',
    )
    expect(phaseInfo(makeProduction(dates), '2026-07-24').phase).toBe(
      'previews',
    )
  })

  it('performance on or after opening, before closing', () => {
    expect(phaseInfo(makeProduction(dates), '2026-07-25').phase).toBe(
      'performance',
    )
    expect(phaseInfo(makeProduction(dates), '2026-08-02').phase).toBe(
      'performance',
    )
  })

  it('closed after closing date', () => {
    expect(phaseInfo(makeProduction(dates), '2026-08-03').phase).toBe('closed')
  })

  it('handles a show with only an opening date set', () => {
    const info = phaseInfo(
      makeProduction({ opening: '2026-10-01' }),
      '2026-09-01',
    )
    expect(info.phase).toBe('pre-production')
    expect(info.nextMilestone?.key).toBe('opening')
    expect(info.daysUntilNext).toBe(30)
  })
})

describe('today: relativeDayPhrase', () => {
  it('handles today/tomorrow/yesterday', () => {
    expect(relativeDayPhrase(0)).toBe('today')
    expect(relativeDayPhrase(1)).toBe('tomorrow')
    expect(relativeDayPhrase(-1)).toBe('yesterday')
  })
  it('handles future/past plurals', () => {
    expect(relativeDayPhrase(12)).toBe('in 12 days')
    expect(relativeDayPhrase(-3)).toBe('3 days ago')
  })
})

describe('today: countdownPhrase', () => {
  const dates = {
    firstRehearsal: '2026-06-22',
    opening: '2026-07-25',
    closing: '2026-08-02',
  }

  it('asks for dates when none are set', () => {
    const { big } = countdownPhrase(phaseInfo(makeProduction()))
    expect(big).toMatch(/Set your show dates/)
  })

  it('shows opening today / tonight', () => {
    const { big } = countdownPhrase(
      phaseInfo(makeProduction(dates), '2026-07-25'),
    )
    expect(big).toMatch(/Opening/i)
    expect(big).toMatch(/TODAY/)
  })

  it('shows opening tomorrow', () => {
    const { big } = countdownPhrase(
      phaseInfo(makeProduction(dates), '2026-07-24'),
    )
    expect(big).toMatch(/tomorrow/i)
  })

  it('shows N days for distant milestones', () => {
    const { big, small } = countdownPhrase(
      phaseInfo(makeProduction(dates), '2026-07-13'),
    )
    expect(big).toMatch(/Opening in 12 days/)
    expect(small).toContain('Saturday')
  })

  it('reports closure for shows past closing', () => {
    const { big, small } = countdownPhrase(
      phaseInfo(makeProduction(dates), '2026-08-10'),
      '2026-08-10',
    )
    expect(big).toBe('The show is closed.')
    expect(small).toMatch(/8 days ago/)
  })
})
