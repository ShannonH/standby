import PdfDownloadButton from '@/components/PdfDownloadButton'
import RequiresProduction from '@/components/RequiresProduction'
import ContactGroupManager from '@/features/contacts/ContactGroupManager'
import ContactList from '@/features/contacts/ContactList'
import DistributePanel from '@/features/distribution/DistributePanel'
import { useContacts, useCurrentProduction } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { contactSheetBody } from '@/lib/templates'
import { renderContactSheetText } from '@/lib/text-reports'

export default function ContactsRoute() {
  return (
    <RequiresProduction>
      <ContactsInner />
    </RequiresProduction>
  )
}

function ContactsInner() {
  const current = useCurrentProduction()
  const contacts = useContacts(current?.id)
  if (!current?.id) return null

  async function generatePdf(): Promise<Blob> {
    if (!current) throw new Error('No production')
    const paperSize = useAppStore.getState().settings.paperSize
    const [{ pdf }, { default: ContactSheetPdf }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/features/contacts/ContactSheetPdf'),
    ])
    return pdf(
      <ContactSheetPdf
        production={current}
        contacts={contacts}
        paperSize={paperSize}
      />,
    ).toBlob()
  }

  return (
    <section className="mx-auto max-w-4xl space-y-10">
      <header>
        <h2 className="font-serif text-3xl font-semibold">Contacts</h2>
        <p className="mt-1 text-sm text-stone-500">
          For <span className="font-medium">{current.name}</span>. Cast,
          creative team, production, crew, venue. Mark a contact{' '}
          <em>do not publish</em> to keep them off the distributed contact
          sheet. Add a phone number so they show up if you ever wire up SMS.
          Build named groups below for one-click batch distribution.
        </p>
      </header>

      <ContactList productionId={current.id} />

      <section className="space-y-3 border-t border-stone-200 pt-8 dark:border-stone-800">
        <h3 className="font-serif text-xl font-semibold">Groups</h3>
        <ContactGroupManager productionId={current.id} />
      </section>

      {contacts.length > 0 && (
        <>
          <section className="space-y-3 border-t border-stone-200 pt-8 dark:border-stone-800">
            <h3 className="font-serif text-xl font-semibold">Exports</h3>
            <PdfDownloadButton
              label="Download contact sheet (PDF)"
              filename={`${current.name.replace(/[^a-z0-9]/gi, '_')}-contact-sheet.pdf`}
              generate={generatePdf}
            />
          </section>
          <DistributePanel
            productionId={current.id}
            artifactLabel="Contact sheet"
            filename={`${current.name.replace(/[^a-z0-9]/gi, '_')}-contact-sheet.pdf`}
            defaultSubject={`Contact sheet — ${current.name}`}
            defaultBody={contactSheetBody(current.name)}
            inlineBody={renderContactSheetText(current, contacts)}
            generatePdf={generatePdf}
          />
        </>
      )}
    </section>
  )
}
