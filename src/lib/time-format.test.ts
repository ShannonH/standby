import { describe, expect, it } from 'vitest'
import { formatTime } from './time-format'

describe('formatTime', () => {
  it('12-hour: morning times use lowercase a', () => {
    expect(formatTime('00:00', '12h')).toBe('12:00a')
    expect(formatTime('00:30', '12h')).toBe('12:30a')
    expect(formatTime('06:00', '12h')).toBe('6:00a')
    expect(formatTime('10:00', '12h')).toBe('10:00a')
    expect(formatTime('11:59', '12h')).toBe('11:59a')
  })

  it('12-hour: noon and afternoon use lowercase p', () => {
    expect(formatTime('12:00', '12h')).toBe('12:00p')
    expect(formatTime('12:30', '12h')).toBe('12:30p')
    expect(formatTime('13:00', '12h')).toBe('1:00p')
    expect(formatTime('18:00', '12h')).toBe('6:00p')
    expect(formatTime('23:45', '12h')).toBe('11:45p')
  })

  it('24-hour: pads to HH:MM', () => {
    expect(formatTime('06:00', '24h')).toBe('06:00')
    expect(formatTime('6:00', '24h')).toBe('06:00')
    expect(formatTime('18:00', '24h')).toBe('18:00')
    expect(formatTime('00:00', '24h')).toBe('00:00')
  })

  it('passes through values that do not look like HH:MM', () => {
    expect(formatTime('10:00a', '12h')).toBe('10:00a')
    expect(formatTime('6:00p', '24h')).toBe('6:00p')
    expect(formatTime('TBD', '12h')).toBe('TBD')
  })

  it('returns empty string for undefined / empty input', () => {
    expect(formatTime(undefined, '12h')).toBe('')
    expect(formatTime('', '12h')).toBe('')
  })
})
