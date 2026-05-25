import { describe, expect, it } from 'vitest'
import {
  contactSheetBody,
  lineNotesBody,
  productionInfoBody,
  propListBody,
  rehearsalReportBody,
} from './templates'

// Regression: in M2.5 distribution defaults to inline body (the artifact text
// is in the email, not an attachment). Templates that say "is attached" /
// "are attached" read as a contradiction with what the recipient sees. These
// tests make sure that wording can't reappear.

const ALL_TEMPLATES: Array<{ name: string; text: string }> = [
  {
    name: 'rehearsalReportBody',
    text: rehearsalReportBody('My Way', 5, '2026-06-15'),
  },
  { name: 'contactSheetBody', text: contactSheetBody('My Way') },
  { name: 'propListBody', text: propListBody('My Way') },
  { name: 'productionInfoBody', text: productionInfoBody('My Way') },
  { name: 'lineNotesBody', text: lineNotesBody('Alice') },
  // Also the signed-off variants, in case anyone re-introduces "attached"
  // talk via the sign-off path.
  {
    name: 'rehearsalReportBody (with name)',
    text: rehearsalReportBody('My Way', 5, '2026-06-15', 'Rayne'),
  },
  {
    name: 'contactSheetBody (with name)',
    text: contactSheetBody('My Way', 'Rayne'),
  },
]

describe('templates: no "attached" language', () => {
  for (const { name, text } of ALL_TEMPLATES) {
    it(`${name} doesn't say "attached" or "attachment"`, () => {
      const lower = text.toLowerCase()
      expect(lower).not.toMatch(/\battach(ed|ment)?\b/)
    })
  }
})

describe('templates: still convey context', () => {
  it('rehearsalReportBody mentions the production and day', () => {
    const out = rehearsalReportBody('My Way', 5, '2026-06-15')
    expect(out).toContain('My Way')
    expect(out).toContain('Day 5')
    expect(out).toContain('2026-06-15')
  })

  it('rehearsalReportBody still teaches the numbered-notes reply convention', () => {
    const out = rehearsalReportBody('My Way', 1, 'today')
    expect(out).toContain('Re: Costumes #3')
  })

  it('lineNotesBody addresses the actor by name and flags privacy', () => {
    const out = lineNotesBody('Alice')
    expect(out).toContain('Hi Alice')
    expect(out.toLowerCase()).toContain('private')
  })

  it('contactSheetBody still explains the "do not publish" convention', () => {
    const out = contactSheetBody('My Way')
    expect(out).toContain('do not publish')
  })
})

describe('templates: sign-off', () => {
  it('appends "— Name" when smName is provided', () => {
    expect(rehearsalReportBody('My Way', 1, 'today', 'Rayne')).toContain(
      '\n\n— Rayne\n',
    )
    expect(contactSheetBody('My Way', 'Rayne')).toContain('\n\n— Rayne\n')
    expect(propListBody('My Way', 'Rayne')).toContain('\n\n— Rayne\n')
    expect(productionInfoBody('My Way', 'Rayne')).toContain('\n\n— Rayne\n')
    expect(lineNotesBody('Alice', 'Rayne')).toContain('\n\n— Rayne\n')
  })

  it('omits the sign-off when smName is empty or undefined', () => {
    // "Hi all —" greeting already contains an em-dash; check the actual
    // sign-off pattern (a paragraph break, em-dash, then a name).
    const signoffPattern = /\n\n— \S/
    expect(rehearsalReportBody('My Way', 1, 'today')).not.toMatch(
      signoffPattern,
    )
    expect(rehearsalReportBody('My Way', 1, 'today', '')).not.toMatch(
      signoffPattern,
    )
    expect(rehearsalReportBody('My Way', 1, 'today', '   ')).not.toMatch(
      signoffPattern,
    )
  })

  it('trims whitespace around the sign-off name', () => {
    expect(rehearsalReportBody('My Way', 1, 'today', '  Rayne  ')).toContain(
      '\n\n— Rayne\n',
    )
  })
})
