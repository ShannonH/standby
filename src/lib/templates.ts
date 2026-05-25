// Body-text templates for distribution emails. Tone is Porter & Alcorn
// collaborative — questions and acknowledgements, not commands.
//
// IMPORTANT: as of M2.5, the default distribution flow appends the full
// artifact text directly to the email body. These templates must NOT say
// "attached" / "is attached" / "see attachment" / etc. — that language is
// only accurate when the SM has opted out of inline-body mode, which is
// the minority path. Phrase the templates as a brief framing of the
// content that follows.

/** Appends "\n\n— Name" if a name is provided, otherwise nothing.
 *  Lets recipients see who sent the report without scanning headers. */
function signoff(smName?: string): string {
  const name = smName?.trim() ?? ''
  return name.length > 0 ? `\n\n— ${name}` : ''
}

export function rehearsalReportBody(
  productionName: string,
  dayNumber: number,
  dateLabel: string,
  smName?: string,
): string {
  return `Hi all —

Tonight's rehearsal report for ${productionName}, Day ${dayNumber} (${dateLabel}).

Department notes are numbered, so reply with "Re: Costumes #3" etc. if you need to refer to a specific note.

Thanks for everything today.${signoff(smName)}
`
}

export function contactSheetBody(
  productionName: string,
  smName?: string,
): string {
  return `Hi all —

The current contact sheet for ${productionName}. Please flag any corrections to me directly.

Entries marked "do not publish" are kept private and are not included.${signoff(smName)}
`
}

export function propListBody(
  productionName: string,
  smName?: string,
): string {
  return `Hi all —

Current prop list for ${productionName}. Status, source, and special-handling tags for each prop are included.

Reply with any additions, changes, or questions.${signoff(smName)}
`
}

export function productionInfoBody(
  productionName: string,
  smName?: string,
): string {
  return `Hi all —

Production information for ${productionName}. Key dates and venue details included.${signoff(smName)}
`
}

export function lineNotesBody(actorName: string, smName?: string): string {
  return `Hi ${actorName} —

Your line notes from rehearsal. These are private — for you only.

Take a quick look before our next rehearsal. Questions on any of them, find me or the AD.${signoff(smName)}
`
}
