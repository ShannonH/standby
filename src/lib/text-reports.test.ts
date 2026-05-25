import { describe, expect, it } from 'vitest'
import {
  emptyRehearsalNotes,
  type Contact,
  type LineNote,
  type Production,
  type Prop,
  type RehearsalReport,
} from './db'
import {
  renderContactSheetText,
  renderLineNotesText,
  renderProductionInfoText,
  renderPropListText,
  renderRehearsalReportText,
} from './text-reports'

const production: Production = {
  id: 1,
  name: 'My Way',
  type: 'musical',
  season: 'Summer 2026',
  organization: 'Otterbein Summer Theatre',
  venue: 'Cowan Hall',
  firstRehearsal: '2026-06-01',
  opening: '2026-07-15',
  createdAt: '',
  updatedAt: '',
}

const alice: Contact = {
  id: 10,
  productionId: 1,
  category: 'cast',
  name: 'Alice',
  role: 'Cinderella',
  email: 'alice@example.com',
  phone: '555-0100',
  pronouns: 'she/her',
}
const bob: Contact = {
  id: 11,
  productionId: 1,
  category: 'cast',
  name: 'Bob',
  role: 'Prince',
  pronouns: 'he/him',
}
const carol: Contact = {
  id: 12,
  productionId: 1,
  category: 'creative',
  name: 'Carol',
  role: 'Director',
  email: 'carol@example.com',
}
const dave: Contact = {
  id: 13,
  productionId: 1,
  category: 'cast',
  name: 'Dave',
  doNotPublish: true,
  email: 'dave@example.com',
}

describe('renderRehearsalReportText', () => {
  const report: RehearsalReport = {
    productionId: 1,
    date: '2026-06-15',
    dayNumber: 5,
    startTime: '18:00',
    endTime: '22:00',
    location: 'Studio Theatre',
    attendance: [
      { contactId: 10, status: 'present' },
      { contactId: 11, status: 'late', minutesLate: 5 },
    ],
    timeBlocks: [
      { start: '18:00', end: '19:30', activity: 'Act 1, scenes 1–3' },
    ],
    notes: {
      ...emptyRehearsalNotes(),
      props: [{ text: 'Hamlet skull needs replacement' }],
      costumes: [
        { text: 'Could we confirm the act 2 jacket fitting?' },
        { text: 'Wig 3 returned to stock.' },
      ],
    },
  }

  it('renders header, attendance, time blocks, and dept notes', () => {
    const out = renderRehearsalReportText(production, report, [alice, bob])
    expect(out).toContain('MY WAY')
    expect(out).toContain('REHEARSAL REPORT — DAY 5')
    expect(out).toContain('Studio Theatre')
    expect(out).toContain('Alice — Present')
    expect(out).toContain('Bob — Late (5 min)')
    // Default time format is 12h; "18:00" / "19:30" render as "6:00p" / "7:30p".
    expect(out).toContain('6:00p–7:30p   Act 1, scenes 1–3')
    expect(out).toContain('COSTUMES')
    expect(out).toContain('1. Could we confirm the act 2 jacket fitting?')
    expect(out).toContain('2. Wig 3 returned to stock.')
    expect(out).toContain('PROPS')
    expect(out).toContain('1. Hamlet skull needs replacement')
  })

  it('skips dept sections that have no notes', () => {
    const out = renderRehearsalReportText(production, report, [alice, bob])
    expect(out).not.toContain('SCENIC')
    expect(out).not.toContain('LIGHTING')
  })

  it('handles "removed contact" cases gracefully', () => {
    const out = renderRehearsalReportText(production, report, [alice]) // bob missing
    expect(out).toContain('(removed)')
  })
})

describe('renderContactSheetText', () => {
  it('groups by category and excludes doNotPublish', () => {
    const out = renderContactSheetText(production, [alice, bob, carol, dave])
    expect(out).toContain('CAST')
    expect(out).toContain('CREATIVE TEAM')
    expect(out).toContain('Alice (she/her) — Cinderella')
    expect(out).toContain('alice@example.com · 555-0100')
    expect(out).toContain('Bob (he/him) — Prince')
    expect(out).toContain('Carol — Director')
    // dave is doNotPublish — must not appear
    expect(out).not.toContain('Dave')
    expect(out).not.toContain('dave@example.com')
  })

  it('skips empty categories', () => {
    const out = renderContactSheetText(production, [alice])
    expect(out).toContain('CAST')
    expect(out).not.toContain('CREATIVE TEAM')
    expect(out).not.toContain('CREW')
  })
})

describe('renderPropListText', () => {
  it('renders each prop with metadata and handling tags', () => {
    const props: Prop[] = [
      {
        productionId: 1,
        name: 'Hamlet skull',
        scenes: ['5.1'],
        characters: ['Hamlet'],
        consumable: false,
        source: 'build',
        status: 'in-rehearsal',
        specialHandling: ['fragile'],
        notes: 'Yorick',
      },
      {
        productionId: 1,
        name: 'Stage blood',
        scenes: ['5.2'],
        characters: ['Hamlet', 'Claudius'],
        consumable: true,
        source: 'buy',
        status: 'needed',
        specialHandling: ['liquid'],
      },
    ]
    const out = renderPropListText(production, props)
    expect(out).toContain('PROP LIST — 2 items')
    expect(out).toContain('• Hamlet skull')
    expect(out).toContain('• Stage blood (consumable)')
    expect(out).toContain('Status: In rehearsal · Source: Build')
    expect(out).toContain('Handling: Fragile')
    expect(out).toContain('Note: Yorick')
  })

  it('pluralizes "item" correctly for a single prop', () => {
    const out = renderPropListText(production, [
      {
        productionId: 1,
        name: 'Lone item',
        scenes: [],
        characters: [],
        consumable: false,
        source: 'unknown',
        status: 'needed',
      },
    ])
    expect(out).toContain('PROP LIST — 1 item\n')
  })
})

describe('renderProductionInfoText', () => {
  it('shows organization, venue, type, and key dates', () => {
    const out = renderProductionInfoText(production)
    expect(out).toContain('MY WAY')
    expect(out).toContain('PRODUCTION INFORMATION')
    expect(out).toContain('Type: Musical')
    expect(out).toContain('Organization: Otterbein Summer Theatre')
    expect(out).toContain('Venue: Cowan Hall')
    expect(out).toContain('KEY DATES')
    expect(out).toContain('First rehearsal:')
    expect(out).toContain('Opening:')
  })

  it('omits empty optional fields', () => {
    const out = renderProductionInfoText({
      id: 2,
      name: 'Minimal',
      type: 'play',
      createdAt: '',
      updatedAt: '',
    })
    expect(out).toContain('Type: Play')
    expect(out).not.toContain('Venue:')
    expect(out).not.toContain('Organization:')
    expect(out).not.toContain('KEY DATES')
  })
})

describe('renderLineNotesText', () => {
  const notes: LineNote[] = [
    {
      productionId: 1,
      rehearsalDate: '2026-06-15',
      page: '42',
      characterId: 10,
      lineType: 'paraphrase',
      scriptedText: 'To be or not to be',
      spokenText: 'To be… or not',
    },
    {
      productionId: 1,
      rehearsalDate: '2026-06-15',
      page: '43',
      characterId: 10,
      lineType: 'drop',
      scriptedText: 'My lord',
      spokenText: '',
      comment: 'Watch the entrance timing here.',
    },
  ]

  it('renders private notes for one actor with type labels', () => {
    const out = renderLineNotesText(production, alice, notes)
    expect(out).toContain('LINE NOTES — ALICE')
    expect(out).toContain('2026-06-15 · p.42 · Paraphrase')
    expect(out).toContain('Scripted: To be or not to be')
    expect(out).toContain('Spoken: To be… or not')
    expect(out).toContain('2026-06-15 · p.43 · Dropped line')
    expect(out).toContain('Note: Watch the entrance timing here.')
  })

  it('handles the no-notes case gracefully', () => {
    const out = renderLineNotesText(production, alice, [])
    expect(out).toContain('No notes for this rehearsal cycle')
  })
})
