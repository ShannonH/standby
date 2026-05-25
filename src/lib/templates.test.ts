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
