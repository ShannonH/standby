import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('csv: toCsv', () => {
  it('serializes a simple table', () => {
    const csv = toCsv(['a', 'b'], [['1', '2']])
    expect(csv).toBe('a,b\r\n1,2\r\n')
  })

  it('escapes commas, quotes, and newlines per RFC 4180', () => {
    const csv = toCsv(
      ['name', 'note'],
      [['Alice', 'has, a comma']],
    )
    expect(csv).toBe('name,note\r\nAlice,"has, a comma"\r\n')
  })

  it('doubles internal double-quotes', () => {
    const csv = toCsv(['x'], [['He said "hi"']])
    expect(csv).toBe('x\r\n"He said ""hi"""\r\n')
  })

  it('treats null and undefined as empty strings', () => {
    const csv = toCsv(['a', 'b', 'c'], [[null, undefined, 'x']])
    expect(csv).toBe('a,b,c\r\n,,x\r\n')
  })
})
