# Research Notes

Preserved findings from the initial research pass (2026-05-25). Two parallel investigations: (1) what stage managers actually do and the paperwork artifacts they own, and (2) the existing software landscape including Stage Write.

These notes are the raw material the [PRD](PRD.md) distills from. Citations included so they survive — don't lose them when the PRD evolves.

---

## Part 1 — Stage Management Primer

Stage management is fundamentally a documentation-and-communication job. The Stage Manager (SM) is the production's central nervous system: they own the paperwork that lets a director, ~10 designers, ~20 actors, and ~30 crew stay in sync. Almost everything they produce is a structured document. That's why this domain is interesting for software — most of it is currently Word/Excel/PDF taped onto a clipboard.

### 1. Pre-Production (script analysis + paperwork build)

Before rehearsals start, the SM reads the script multiple times and builds a foundation of reference paperwork. Key artifacts:

- **Prompt book (skeleton).** A 3-ring binder, traditionally. The script is mounted one-sided so the facing page is blank for blocking and cues. It eventually holds the master script, contact sheets, ground plans, schedules, reports, and emergency info. USC's BFA learning objective literally names "creating a working production prompt book" as a graduation-level competency ([USC BFA SM Learning Objectives](https://dramaticarts.usc.edu/programs/undergraduate/learning-objectives/), [TheatreCrafts: Prompt Book](https://theatrecrafts.com/pages/home/topics/stage-management/the-prompt-book/)).
- **Scene/character breakdown (a.k.a. French scene breakdown).** A spreadsheet/matrix with characters on one axis and scenes (or musical numbers) on the other; cells note enter/exit pages, sing vs. speak, doubling. A "French scene" splits the script at every entrance/exit, not just at act/scene markers — useful for scheduling and doubling decisions ([Everything Backstage: French Scene Breakdown](https://everythingbackstage.com/french-scene-breakdown/), [ShowCaller: Scene/Character Breakdown](https://showcaller.wordpress.com/2014/03/08/sm-101-the-scenecharacter-breakdown/)).
- **Contact sheet.** Cast, creative team, crew, production office, theatre admin. The SM owns this and updates it constantly.
- **Preliminary prop list.** SM compiles every prop mentioned in the script with page number, character, consumable Y/N. The props designer then owns sourcing — but the SM owns the master list that everyone reconciles against ([Props Table sample](http://www.propstable.com/props-list.html), [USITT SM samples](http://rm.usitt.org/sm.html)).
- **Costume plot.** SM does a first pass (who wears what in which scene), then the costume designer takes over. SM keeps consuming/cross-referencing it.
- **Rehearsal schedule.** Built from the French scene breakdown + director's plan. Daily calls go out the night before (in Equity contexts, the deadline is contractually fixed).

**Painful today:** the same source-of-truth data (who's in what scene, on what page) is re-keyed into 5+ spreadsheets. The French scene breakdown should drive the schedule, the prop list, the costume plot, and casting/doubling analysis — but it's all manual.

### 2. Rehearsal Phase

Now the SM is at the table 6 days a week, taking notes nonstop. Daily artifacts:

- **Blocking notation in the prompt book.** Each character gets a one- or two-letter symbol (often boxed: ⬜H for Hamlet). The facing page has a mini ground plan reproduced from the scenic designer, plus numbered annotations matching numbers placed in the script ("①" next to a line, with "① H X DSR to chair" on the facing page — "Hamlet crosses downstage right to chair"). Pencil only — blocking changes constantly. Standard abbreviations: X (cross), DSR/USL/CS (downstage right, upstage left, center stage), ENT/EX, R/L. Musicals add bar numbers and "8-counts" instead of (or alongside) script line cues ([LibreTexts: Blocking Notation](https://human.libretexts.org/Courses/Santa_Barbara_City_College/Mastering_the_Art_of_Stagecraft_(Crop)/15:_Stage_Management/15.03:_Blocking_Notation), [Hannah Pohlman: How SMs Record Blocking](https://www.hannahpohlman.com/new-blog-1/2025/1/3/how-stage-managers-record-blocking), [Acting Up: Blocking Abbreviations PDF](https://www.actingup.com/uploads/7/0/9/4/70948297/blockinginfo.pdf)).
- **Daily rehearsal report.** Emailed every night to the entire production team. Sections: who was called/late/absent, time breakdown of what was rehearsed, then **departmental notes** numbered and grouped by department (Scenic, Costumes, Props, Lighting, Sound, Music, Production). Numbering matters — it lets a costume designer reply "Re: Costumes #3, yes." Templates from Bard, Routledge, USITT all share this structure ([Bard Rehearsal Report Template PDF](https://www.bard.org/media/stage-management-1-rehearsal-report-template-2.pdf), [The Stage Manager's Toolkit – Rehearsals](https://routledgetextbooks.com/textbooks/9781138183773/rehearsals.php)).
- **Line notes.** Given to actors who paraphrased, dropped, or added words. Format: page/character/what they said vs. what's scripted.
- **Daily call.** Tomorrow's schedule sent the night before. In Equity, has hard rules: 5-min break per 55 min, etc. ([Complete SM: Work Rules](https://sites.google.com/site/thecompletestagemanager/calendars/work-related-rules)).
- **ASM tracking sheets.** The Assistant SM(s) maintain prop preset/strike lists, run sheets, costume tracking, and spike-mark plots — "the show's nervous system" ([StageLync: What ASMs Do](https://stagelync.com/news/ever-wonder-what-does-an-assistant-stage-manager-actually-do)).

**Painful today:** Line notes are still mostly handwritten, then re-typed. Rehearsal reports are 30–60 min of typing every night after a 10-hour rehearsal. Blocking is pencil-and-paper, so a sick SM can't share their book digitally.

### 3. Tech Week & Performance Phase

The prompt book transforms into the **calling script**. The SM moves from the rehearsal room to the booth and starts running the show.

- **Cues** are added in pencil on the facing page, color-coded by department: LX (lighting), SD/SQ (sound), FLY, AUTO (automation), DECK, FOH (front of house). Each cue gets a number per department: "LX 47," "SD Q," "FLY 12." A bracket or arrow on the script marks the exact word/syllable/beat where "GO" is called ([LibreTexts: Cueing Scripts](https://human.libretexts.org/Courses/Santa_Barbara_City_College/Mastering_the_Art_of_Stagecraft_(Crop)/15:_Stage_Management/15.05:_Cueing_Scripts), [TheatreCrafts: Calls and Cans](https://theatrecrafts.com/pages/home/topics/stage-management/calls-and-cans/)).
- **Calling protocol.** Three levels: **Warning** (cue approaching, optional), **Standby** ("Standby LX 47 and Sound Q" — operators acknowledge), then **GO** ("LX 47… GO"). "Go" is the only legal trigger word. Stacked cues: "LX 47 and Sound Q… GO." Independent close cues: "LX 47… GO. Sound Q… GO." ([Complete SM: The Calling Script](https://sites.google.com/site/thecompletestagemanager/tech/the-calling-script)).
- **Cue-to-cue (Q2Q) rehearsal** is the first tech rehearsal — skips between cues only, locking in timing.
- **Show report (a.k.a. performance report).** Sent after every performance. Includes: house count, run times per act, intermission length, hold time, technical issues, missed/late cues, injuries, audience incidents, notes for each department ([TheatreCrafts: The Show Report](https://theatrecrafts.com/pages/home/topics/stage-management/the-show-report/)).
- **Sign-in sheets, understudy tracking, fight/intimacy call logs** also live with the SM.

**Musical-specific:** SM also coordinates with the conductor — cues may key off downbeats, bar numbers, or vamps rather than spoken lines. The conductor is on a video monitor; SM may call "Visual" for the music director to give a downbeat.

**Painful today:** Cues change up to 20 times during tech. Erasing pencil and re-marking the calling script is constant. Show reports are repetitive structured data being typed as freeform email. A digital calling script with versioned cues and one-click report templates would save real hours.

### 4. Equity vs. Non-Equity vs. College

- **AEA (Actors' Equity Association)** governs union productions in the US, including SMs (they're in the same union as actors). Equity contracts dictate break times, daily/weekly hours, payment, housing — and Equity SMs cannot work non-union ([AEA Wikipedia](https://en.wikipedia.org/wiki/Actors%27_Equity_Association), [ATX Theatre: Unions](https://www.atxtheatre.org/unions-professionalism)).
- **URTA** is the equivalent for graduate-level university theatre and gives students a structured way to interact with Equity ([American Theatre on Equity](https://www.americantheatre.org/2021/07/29/actors-equity-blows-open-the-doors/)).
- **College/undergrad** programs (USC, BU, Illinois, Ohio, UCF, WMU, Miami) teach Equity *conventions* — prompt book formatting, report formats, calling protocol — even though the shows themselves are non-union. The daughter will be learning the Equity-style paperwork because that's the professional standard ([USC BFA SM](https://dramaticarts.usc.edu/programs/undergraduate/stage-management/), [BU CFA](https://www.bu.edu/cfa/academics/degrees-programs/stage-management/bfa/), [Illinois BFA SM](https://theatre.illinois.edu/training-programs/undergraduate-programs/bfa-stage-management/)).

### Where Software Wins

Ranked by pain × frequency:

1. **Rehearsal & show reports** — same structure every night, currently freeform email. Templated forms with auto-routing to departments would save 30+ min/day.
2. **Line notes** — handwritten during run, then re-typed. Voice/tablet capture with script-linked metadata is an obvious win.
3. **Digital prompt book / calling script** — synced blocking + cues, version history, shareable. Existing tools (Stage Write, ProductionPro, PromptR) hint at the market.
4. **Single source of truth for the scene/character matrix** — should drive scheduling, prop lists, costume plots, doubling analysis instead of being copy-pasted into each.
5. **Daily call generation** — currently rebuilt nightly from the scene breakdown + director's plan; should be a query, not a document.
6. **Prop & costume tracking** — three departments touching the same list with different concerns; classic shared-state problem.

The "paper on a clipboard" side that resists software: blocking notation during active rehearsal (pencil-on-paper is still faster than any tablet), and the calling script in performance (no SM will trust a flaky app when "GO" has to happen on a specific syllable).

### Key Sources

**The textbooks our motivating user's BFA program (Ball State) actually uses — anchor our form conventions and tone to these:**

- **Stern, Lawrence and Jill Gold. *Stage Management*, 12th edition.** Routledge, 2022. ISBN 9780367647896. The long-running practical standard (Stern's first ed. dates to the 1970s). Forms-and-checklists driven; rich with templates and step-by-step procedures spanning Broadway, off-Broadway, regional, community, and 99-seat Equity-waiver houses. Gold (AEA SM: *Wicked, Les Mis, City of Angels*) brings the touring/professional voice. **This is the book to align Standby's form templates with.** ([Routledge](https://www.routledge.com/Stage-Management/Stern-Gold/p/book/9780367647896))
- **Porter, Lisa and Narda E. Alcorn. *Stage Management Theory as a Guide to Practice: Cultivating a Creative Approach*, 2nd edition.** Focal Press / Routledge, 2023. ISBN 9781032323602. The leading equity-and-inclusion-centered SM pedagogy. Porter (UC San Diego), Alcorn (Chair, Yale Drama SM). Frames SM as relational and ethical practice — tactile strategies for navigating different collaborator groups. **Anchor Standby's default note phrasing and language to this book's voice.** ([Routledge](https://www.routledge.com/Stage-Management-Theory-as-a-Guide-to-Practice-Cultivating-a-Creative-Approach/Porter-Alcorn/p/book/9781032323602))
- **Jaen, Rafael and Christopher Sadler, eds. *Off Headset: Essays on Stage Management Work, Life, and Career*.** Routledge (Backstage Series), 2022. ISBN 9780367337520. Diverse contributor essays across regional, Broadway, opera, cruise, circus — plus self-care, leadership, business. Supplementary; useful for sensitizing UI copy to working-SM perspectives. ([Routledge](https://www.routledge.com/Off-Headset-Essays-on-Stage-Management-Work-Life-and-Career/Jaen-Sadler/p/book/9780367337520))

**Other foundational texts (not used at our motivating user's program but widely cited):**

- Kelly, Thomas A. *The Back Stage Guide to Stage Management*, 3rd ed. ([Penguin Random House](https://www.penguinrandomhouse.com/books/91279/the-back-stage-guide-to-stage-management-3rd-edition-by-thomas-kelly/))
- Kincman, Laurie. *The Stage Manager's Toolkit* (Routledge). ([Routledge](https://routledgetextbooks.com/textbooks/9781138183773/rehearsals.php))

**Industry references and sample paperwork:**

- USITT sample paperwork archive ([rm.usitt.org/sm.html](http://rm.usitt.org/sm.html))
- TheatreCrafts.com stage management section (UK-leaning but excellent reference)
- Stage Management Resource ([stagemanagementresource.com/paperworkexamples](http://www.stagemanagementresource.com/paperworkexamples))
- Davidson College SM Handbook ([PDF](https://www.davidson.edu/media/560/download)), CCSU SM Handbook ([PDF](https://www.ccsu.edu/sites/default/files/2024-06/SM%20and%20ASM%20Handbook.pdf)), UW Drama ([PDF](http://depts.washington.edu/uwdrama/files/stage-management-manual.pdf)) — representative college-level guides
- Actors' Equity Association ([actorsequity.org](https://www.actorsequity.org/resources/producers/agreements-and-forms/single-engagement-agreement))

---

## Part 2 — Software Landscape

### Tool-by-tool

#### Stage Write — the incumbent to beat
**Platforms:** iPad app (free shell) + web app. Offline mode on iPad with sync-on-reconnect.

**Pricing (the punchline):** Single Production $5.99/mo or $59.99/yr; Pro (unlimited shows) $9.99/mo or $99.99/yr; View-Only (for actors/swings) $0.99/mo; Creative Team Bundle $249/yr (3 Pro + unlimited view-only); Educational Bundle $599/yr for 10 seats. ([Stage Write pricing](https://www.stagewritesoftware.com/pricing))

**Strengths (consistent across reviews):**
- Spacing/blocking charts on an uploaded ground plan with traffic arrows — universally praised as fast and visual. ([Stage Write iPad page](https://www.stagewritesoftware.com/ipad-app))
- Script + cue marking + collaborator sync. Holds a US patent and is the de facto standard on Broadway (100+ shows, 100k users claimed). ([stagewritesoftware.com](https://www.stagewritesoftware.com/))
- Same-day customer support — multiple App Store reviewers call this out. ([App Store listing](https://apps.apple.com/us/app/stage-write/id1004288568))
- True offline editing on iPad. ([brokegirlrich](https://brokegirlrich.com/ipad-apps-for-stage-managers/))

**Weaknesses (the actual reviews — note the rating is only 3.3/5 with 15 ratings):**
- A recent UI redesign removed the bottom "hot bar" for moving shapes; reviewer flat-out said "I used to love the app a lot more before the changes." ([App Store](https://apps.apple.com/us/app/stage-write/id1004288568))
- No way to mark "blocking comes in on *this* word" — granularity stops at the line.
- Side-of-script chart annotations **disappear when you export to PDF** — meaning the director's PDF is worse than the SM's view.
- Steep learning curve. ([jiyushe.com](https://jiyushe.com/stage-manager/the-pros-and-cons-of-different-stage-management-software-and-tools.html))
- iPad/iOS only — no Android, and the web app is the same data but a worse editing experience.
- Expensive relative to a student budget; the per-user model breaks down when an SM wants to drop the prompt book on a director, two ASMs, and a board op. ([liveabout.com top 10](https://www.liveabout.com/best-apps-for-stage-tech-4165263))

#### Virtual Callboard — the distribution incumbent (added v0.2)

**Product:** [virtualcallboard.com](https://www.virtualcallboard.com/), by EmptySpace Technology LLC. Web + mobile, accounts required, fully backend-driven. Mature product (live since ~2015).

**Pricing:** Tiered SaaS.
- Free tier: archived productions, read-only.
- **$20/month** for 1 active production.
- **+$10/month** per additional active production.
- **$150/month** unlimited (13+ productions).
- 30-day trial. **No dedicated educational or non-profit tier.**

**Adoption:** Used by Ball State University's Department of Theatre and Dance (where our motivating user is a BFA SM student) and Lycoming College. Has been an exhibitor at the Pace University Broadway Stage Management Symposium, so it has visibility in the academic SM pipeline.

**Features it owns:**
- Announcements with auto-expiration.
- Notes/emails with **read-receipt tracking**.
- Discussion forums with file attachments.
- Production scheduling with **automatic double-booking detection**.
- Open calls / crew sign-ups.
- Daily or per-call attendance entry, with weekly hour calculations.
- **Customizable, unlimited report templates** with draft / preview / distribution and revision tracking ("if you change a report, an updated revision will go out").
- Contact sheets with department, emergency contact, medical info, and role-based privacy.
- External vendor contacts.
- Multi-production support, archive/export.
- Mobile + web apps, **email / SMS / push notifications**.

**Features notably absent:**
- **No line notes.**
- **No blocking notation.**
- **No prop tracking.**
- No cast-submitted time-off / conflict-request workflow (only double-booking *detection*).
- No script integration (that's ProductionPro's territory).

**Honest competitive read:** VCB's distribution layer is structurally inaccessible to a no-backend static PWA. The push notifications, server-side read receipts, and multi-user shared state require infrastructure we deliberately don't have. **We can't compete on team-wide communication.**

However: VCB's $240-$1,800/yr pricing and account-required, vendor-approval-required posture leaves a real lane. Many users we care about don't have VCB — summer programs, community theatre, fringe productions, college programs without departmental subscriptions, and post-graduation SMs entering venues without budget. Our motivating user is a perfect example: at Ball State during the school year she has VCB, but at her **Otterbein summer internship** she's emailing every cast member every piece of paperwork by hand. That's our user, today.

**Strategic conclusion:** Don't fight VCB on distribution; reposition Standby as the SM's *personal* paperwork tool — drafting, archiving, organizing, exporting — and shrink the manual-email tax through batched `mailto:` flows, Web Share API, and (V2 stretch) static "publish bundle" HTML exports. We also pick up line notes + prop tracking, which VCB ignores even for its paying customers.

#### ProductionPro
**Platforms:** iPad + web. **Pricing:** Free tier (1 production, 3 collaborators, 1GB); Premium adds unlimited productions and 5GB/production. ([slashdot.org](https://slashdot.org/software/p/ProductionPro/))

**Good at:** Visual script breakdown — attach images/video/audio to script regions, layered annotations, transfer notes between script revisions. Loved by directors and designers more than SMs. ([wifitalents.com](https://wifitalents.com/best/stage-management-software/))

**Bad at:** "App crashes often on iPad and locks users out with error messages." More of a creative production book than a calling tool — SMs use it alongside, not instead of, Stage Write. ([slashdot.org](https://slashdot.org/software/p/ProductionPro/))

#### Propared
**Platforms:** Web (mobile-friendly). **Pricing:** Subscription — repeatedly called expensive for what it is. ([G2](https://www.g2.com/products/propared/reviews), [Capterra](https://www.capterra.com/p/141392/Propared/))

**Good at:** Production scheduling, contacts, calendar, multi-event coordination. Festivals and presenting orgs love it.

**Bad at:** No blocking, no script, no cue calling. "Minimalist design extends to paperwork: all schedules and reports look alike" — SMs want formatting control. ([softwareworld.co](https://www.softwareworld.co/software/propared-reviews/)) Setup overhead.

#### StageKeep
**Platforms:** Web. Visible at [app.stagekeep.com](https://app.stagekeep.com/) but with thin public documentation. Coverage is brief in every listicle — feels like a smaller player focused on logistics/rehearsals/reviews. ([captitles.com](https://www.captitles.com/apps-for-technical-theatre)) Not widely discussed in forums; not a real competitor for the prompt-book workflow.

#### Cue to Cue / CuePad / DSMPrompt — the digital-prompt-book niche
A cluster of newer apps explicitly going after the calling-script use case: annotate the script, mark standbys/GOs, run the show off the iPad. ([cue-to-cue.dk](https://cue-to-cue.dk/en/home), [cuepad.app](https://cuepad.app/), [DSMPrompt on the App Store](https://apps.apple.com/ph/app/dsmprompt/id6752832596)). Most are paid iPad apps; CuePad bills itself as "digital prompt book built for stage managers" with blocking + ground plan. Adoption appears modest — they don't show up in college-program syllabi the way Stage Write does.

#### QLab — adjacent, not competing
Mac-only, the industry standard for *firing* sound/video/lighting cues. SMs call cues *to* a board op who runs QLab; only on small shows does the SM run QLab themselves. Search results show occasional discussion of using QLab as the SM's rundown (Google Groups), but no one recommends it as a prompt-book replacement. ([QLab Google Group](https://groups.google.com/g/qlab/c/6sMGq-k6iiA)) Worth noting as the boundary — your app should *export to* or *coexist with* QLab's world, not replace it.

#### The DIY tier — where everyone actually lives
This is the real competitor.

- **OneNote / Evernote** for the prompt book itself — recommended on ControlBooth for "massive amount of information (text, sketches, audio, links)" with team sharing. ([controlbooth.com](https://www.controlbooth.com/threads/stage-management-software-top-10-list.30614/))
- **Google Sheets / Excel** for rehearsal reports, line notes, prop tracking, sign-in sheets, run sheets — cells linked across worksheets so updates propagate to dept run sheets. Etsy sells line-notes templates for real money. ([stagemanagementresource.com](http://www.stagemanagementresource.com/paperworkexamples), [Etsy line notes template](https://www.etsy.com/listing/815172679/stage-management-line-notes-excel))
- **Notion** — "Stage Manager's Bible" and "Stage Manager Compendium" templates are official Notion marketplace items, used as full production hubs. ([Notion marketplace](https://www.notion.com/templates/the-stage-manager-s-bible))
- **Google Drive + Calendar** — "hands-down the most useful app" per working SMs.
- **PDF + Apple Pencil in GoodNotes/Notability/ForScore** — the most common digital prompt book in practice. ([theatrecrafts.com](https://theatrecrafts.com/pages/home/topics/stage-management/the-prompt-book/))
- **Paper, three-ring binder, pencil** — still the default at most college programs and most regional houses.

#### Open source / free
There is essentially **no real open-source competitor.** CUNY's "Promptbook" is a teaching resource page, not software ([openlab.citytech.cuny.edu](https://openlab.citytech.cuny.edu/ent-stage-management/promptbook/)). This is a real gap.

### Synthesis — the gaps and the opportunity

**Universal complaints across the whole landscape:**

1. **Per-seat / per-show pricing is hostile to student and amateur productions.** Stage Write at $59.99/yr per SM, $249 for a creative team, $599 for ten student seats — for a one-show high school or fringe production that's absurd. This is the single loudest theme in every "best apps" roundup. ([liveabout.com](https://www.liveabout.com/best-apps-for-stage-tech-4165263))
2. **PDF/print export is consistently the weak link.** Stage Write's annotations vanish in PDF; Propared paperwork is generic; nobody nails clean, paper-format, letter-size-printable handoff to a director who refuses an iPad. This is *the* recurring complaint, because the SM's job is half communication.
3. **Trust in digital prompt books during a live show is shaky.** "Horror stories about losing everything mid-show" is the explicit phrase. Crashes (ProductionPro), forced logins, expired subscriptions mid-tech — these are existential failures for an SM. Local-first + offline + survives-without-the-cloud is non-negotiable.
4. **Granularity of blocking.** Nothing ties a blocking change to a *word* in the script — it's all line- or beat-level. This came up specifically about Stage Write.
5. **The handoff problem.** SM uses Stage Write, director wants a PDF, designers want ProductionPro, board op wants QLab, producer wants Propared, props master wants Excel. Every tool assumes it's the whole world. No tool exports cleanly into the others' formats.
6. **iOS-only locks out half of cast and crew.** Android SMs and Android-using actors are second-class citizens everywhere except Promptbook.
7. **No one nails rehearsal report + line notes + prop tracking + sign-in in one place** — that's why Excel and Notion templates dominate the actual day-to-day. Specialist apps over-invest in blocking and under-invest in the boring 80% of paperwork. ([stagemanagementresource.com](http://www.stagemanagementresource.com/paperworkexamples))

**Hard constraints any new tool must respect:**

- **Offline-first.** Backstage and rehearsal rooms have terrible wifi; SMs work in basements. Stage Write got this right; you must match it. IndexedDB + service worker is the right shape for a PWA.
- **Letter-paper printable PDF.** Rehearsal reports, run sheets, prop lists — must print *cleanly,* one page per item, headers/footers intact. This alone would beat Propared.
- **Local file export / import.** SMs are paranoid about lock-in and lost-show horror stories. JSON export, PDF export, .csv for line notes. "Your data is yours and lives on your disk" is a real differentiator vs. Stage Write's cloud-only model.
- **Cross-device without an account requirement.** GitHub Pages + IndexedDB + optional file-based sync (or "export your show as a .zip and email it to your ASM") beats forcing accounts for casual collaborators.
- **Fast cue calling under pressure.** Big touch targets, no modal dialogs, no "are you sure," no spinner waiting on a network call. The calling view must be usable with sweaty hands in a dark booth.
- **Script-anchored blocking, including word-level anchoring** — the unfilled gap Stage Write has.
- **Handoff exports** — clean PDF for the director, .csv for designers' line notes, plain-text for emailing a rehearsal report.

### The real opportunity

**Stage Write** (iPad-only, cloud-locked, subscription-priced, weak PDF export, losing fans after UI redesign) owns blocking-on-ground-plan and not much else.

**Virtual Callboard** (mature, accounts-required, $20-$150/mo) owns team-wide distribution + scheduling + reports for the programs and venues that can afford it — Ball State, Lycoming, etc. But its pricing locks out summer programs, community theatre, fringe, high school, post-graduation SMs in non-VCB venues, and college programs without departmental subscriptions. And it doesn't do line notes, blocking, or prop tracking even for paying customers.

**The DIY tier** (Google Sheets + Notion + GoodNotes + paper + manual email) is doing the whole job for the un-VCB'd majority — for free, but with zero integration.

**Standby's lane:**
- Don't fight Stage Write on blocking; we won't win there in a browser.
- Don't fight VCB on distribution; we can't without a backend.
- **Fight the DIY tier and the unowned personal-paperwork tier of VCB.** A free, offline-first, browser-based PWA that handles rehearsal reports + line notes + props + contact sheets + show reports + schedule + character matrix — with great PDF export, no accounts, JSON-on-disk portability, and batched-`mailto:` distribution that collapses the manual-email pain — beats both the DIY stack *and* the line-notes/props gap VCB leaves open.
- The motivating user — a Ball State BFA SM doing her Otterbein summer internship without VCB — is the proof: she knows what "good" feels like (VCB), she's currently living the pain (manual email), and she will graduate into a non-VCB world full-time within a year or two. She is *the* target user, and her cohort is large.

### Software-landscape sources

- [Virtual Callboard — homepage](https://www.virtualcallboard.com/)
- [Virtual Callboard — features](https://www.virtualcallboard.com/features/)
- [Virtual Callboard — pricing](https://www.virtualcallboard.com/subscription-packages/)
- [EmptySpace Technology (Virtual Callboard's maker)](https://www.theemptyspace.com/virtualcallboard/)
- [Stage Management Simplified: Virtual Callboard (LinkedIn, Bryan Runion)](https://www.linkedin.com/pulse/stage-management-simplified-virtual-callboard-bryan-runion)
- [Lycoming College Stage Management page — uses Virtual Callboard](https://www.lycoming.edu/theatre/stage-management.aspx)
- [Pace University 2026 Broadway SM Symposium (VCB exhibitor)](https://www.pace.edu/news/press-release-pace-university-host-12th-annual-broadway-stage-management-symposium-sands)
- [SMNetwork forum — Virtual Callboard discussion](https://smnetwork.org/forum/tools-of-the-trade/virtual-callboard/)
- [Stage Write — App Store listing](https://apps.apple.com/us/app/stage-write/id1004288568)
- [Stage Write — pricing](https://www.stagewritesoftware.com/pricing)
- [Stage Write — iPad app page](https://www.stagewritesoftware.com/ipad-app)
- [Stage Write — main site](https://www.stagewritesoftware.com/)
- [brokeGIRLrich — iPad apps for stage managers](https://brokegirlrich.com/ipad-apps-for-stage-managers/)
- [LiveAbout — Top 10 Apps for Stage Management](https://www.liveabout.com/best-apps-for-stage-tech-4165263)
- [ControlBooth — Stage management software top 10 list](https://www.controlbooth.com/threads/stage-management-software-top-10-list.30614/)
- [JiYu Stage Manager Digest — Pros and cons of stage management software](https://jiyushe.com/stage-manager/the-pros-and-cons-of-different-stage-management-software-and-tools.html)
- [Captitles — 60+ technical theatre apps](https://www.captitles.com/apps-for-technical-theatre)
- [G2 — Propared reviews](https://www.g2.com/products/propared/reviews)
- [Capterra — Propared](https://www.capterra.com/p/141392/Propared/)
- [SoftwareWorld — Propared reviews](https://www.softwareworld.co/software/propared-reviews/)
- [Slashdot — ProductionPro reviews](https://slashdot.org/software/p/ProductionPro/)
- [WifiTalents — best stage management software 2026](https://wifitalents.com/best/stage-management-software/)
- [Cue to Cue — digital prompt book](https://cue-to-cue.dk/en/home)
- [CuePad](https://cuepad.app/)
- [DSMPrompt — App Store](https://apps.apple.com/ph/app/dsmprompt/id6752832596)
- [Theatrecrafts — Prompt book overview](https://theatrecrafts.com/pages/home/topics/stage-management/the-prompt-book/)
- [Stage Management Resource — paperwork examples](http://www.stagemanagementresource.com/paperworkexamples)
- [Notion — Stage Manager's Bible template](https://www.notion.com/templates/the-stage-manager-s-bible)
- [Notion — Stage Manager Compendium template](https://www.notion.com/templates/stage-manager-compendium)
- [Etsy — line notes Excel template](https://www.etsy.com/listing/815172679/stage-management-line-notes-excel)
- [QLab — Google Groups, SM as rundown](https://groups.google.com/g/qlab/c/6sMGq-k6iiA)
- [StageKeep](https://app.stagekeep.com/)
- [CUNY OpenLab — Promptbook resource](https://openlab.citytech.cuny.edu/ent-stage-management/promptbook/)
