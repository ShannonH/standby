import { describe, expect, it } from 'vitest'
import { buildMailtoUrl } from './mailto'

describe('buildMailtoUrl', () => {
  it('encodes spaces in subject as %20, not + (RFC 6068)', () => {
    const url = buildMailtoUrl([], 'Production info — My Way', '')
    expect(url).not.toContain('+')
    expect(url).toContain('subject=Production%20info')
  })

  it('encodes spaces in body as %20, not + (regression: M2.4 mailto bug)', () => {
    const body =
      'Production information sheet for My Way attached. Key dates and venue details are inside.'
    const url = buildMailtoUrl([], '', body)
    expect(url).not.toContain('+')
    expect(url).toContain('My%20Way%20attached')
  })

  it('preserves newlines as %0A in body so the client renders paragraphs', () => {
    const url = buildMailtoUrl([], '', 'Hi all —\n\nReport attached.')
    expect(url).toContain('%0A%0A')
  })

  it('uses raw commas between BCC addresses', () => {
    const url = buildMailtoUrl(
      ['alice@example.com', 'bob@example.com'],
      '',
      '',
    )
    expect(url).toContain('bcc=alice%40example.com,bob%40example.com')
  })

  it('skips empty fields cleanly', () => {
    expect(buildMailtoUrl([], '', '')).toBe('mailto:')
    expect(buildMailtoUrl([], 'subj', '')).toBe('mailto:?subject=subj')
  })

  it('encodes special characters in the body (em dash, ampersand)', () => {
    const url = buildMailtoUrl([], '', 'Hi all — coffee & cake?')
    // em dash U+2014 → %E2%80%94, ampersand → %26
    expect(url).toContain('%E2%80%94')
    expect(url).toContain('%26')
  })
})
