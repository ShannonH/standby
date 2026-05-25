import { describe, expect, it } from 'vitest'
import { greet, pickGreetingKind } from './greeting'

function at(hour: number): Date {
  return new Date(2026, 5, 15, hour, 0, 0)
}

describe('pickGreetingKind', () => {
  it('returns morning for 5–11', () => {
    expect(pickGreetingKind(at(5))).toBe('morning')
    expect(pickGreetingKind(at(8))).toBe('morning')
    expect(pickGreetingKind(at(11))).toBe('morning')
  })

  it('returns afternoon for 12–16', () => {
    expect(pickGreetingKind(at(12))).toBe('afternoon')
    expect(pickGreetingKind(at(15))).toBe('afternoon')
    expect(pickGreetingKind(at(16))).toBe('afternoon')
  })

  it('returns evening for 17–21', () => {
    expect(pickGreetingKind(at(17))).toBe('evening')
    expect(pickGreetingKind(at(20))).toBe('evening')
    expect(pickGreetingKind(at(21))).toBe('evening')
  })

  it('returns late-night for 22–04', () => {
    expect(pickGreetingKind(at(22))).toBe('late-night')
    expect(pickGreetingKind(at(23))).toBe('late-night')
    expect(pickGreetingKind(at(0))).toBe('late-night')
    expect(pickGreetingKind(at(4))).toBe('late-night')
  })
})

describe('greet', () => {
  it('appends the trimmed name with a comma', () => {
    expect(greet('Rayne', at(20))).toBe('Good evening, Rayne.')
    expect(greet('  Rayne  ', at(20))).toBe('Good evening, Rayne.')
  })

  it('omits the comma + name when name is empty or whitespace', () => {
    expect(greet('', at(20))).toBe('Good evening.')
    expect(greet('   ', at(20))).toBe('Good evening.')
  })

  it('handles undefined and null defensively (persisted-state hydration lag)', () => {
    expect(greet(undefined, at(20))).toBe('Good evening.')
    expect(greet(null, at(20))).toBe('Good evening.')
  })

  it('uses "Long night" for late-night hours', () => {
    expect(greet('Rayne', at(23))).toBe('Long night, Rayne.')
    expect(greet('Rayne', at(2))).toBe('Long night, Rayne.')
  })
})
