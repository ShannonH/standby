// Body-text templates for distribution emails. Tone is Porter & Alcorn
// collaborative — questions and acknowledgements, not commands.

export function rehearsalReportBody(productionName: string, dayNumber: number, dateLabel: string): string {
  return `Hi all —

Tonight's rehearsal report for ${productionName}, Day ${dayNumber} (${dateLabel}), is attached.

Notes are grouped by department and numbered, so reply with "Re: Costumes #3" etc. if you need to refer to a specific note.

Thanks for everything today.
`
}

export function contactSheetBody(productionName: string): string {
  return `Hi all —

The current contact sheet for ${productionName} is attached. Please flag any corrections to me directly.

Entries marked "do not publish" are kept private and are not included.
`
}

export function propListBody(productionName: string): string {
  return `Hi all —

Current prop list for ${productionName} attached. Status, source, and special-handling tags for each prop are included.

Reply with any additions, changes, or questions.
`
}

export function productionInfoBody(productionName: string): string {
  return `Hi all —

Production information sheet for ${productionName} attached. Key dates and venue details are inside.
`
}

export function lineNotesBody(actorName: string): string {
  return `Hi ${actorName} —

Your line notes from rehearsal are attached. These are private — for you only.

Take a quick look before our next rehearsal. Questions on any of them, find me or the AD.
`
}
