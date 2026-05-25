import { useMemo, useState } from 'react'
import { Button, Field, Input, Select, Textarea } from '@/components/Form'
import { db, type Contact, type ContactGroup } from '@/lib/db'
import { useContactGroups, useContacts } from '@/lib/hooks'

interface Props {
  productionId: number
  /** Short human-readable label for the artifact, used in the send log. */
  artifactLabel: string
  /** Suggested filename for the PDF download. */
  filename: string
  /** Pre-filled email subject line. */
  defaultSubject: string
  /** Pre-filled email body. */
  defaultBody: string
  /** Lazy-builds the PDF as a Blob when "Download PDF" or "Share" is clicked. */
  generatePdf: () => Promise<Blob>
}

interface ResolvedRecipients {
  emails: string[]
  count: number
  label: string
}

/**
 * Reusable distribution panel. Lives below an artifact view and lets the SM:
 *
 *   1. Download the artifact as a PDF.
 *   2. Pick a contact group (or "All contacts with email").
 *   3. Open the user's mail client via mailto: with the group BCC'd, subject
 *      and body pre-filled. The user then drags the downloaded PDF into the
 *      compose window (mailto: cannot carry attachments).
 *   4. On mobile, use the Web Share API to share the PDF natively (full
 *      attach flow without the manual drag step).
 *
 * Every distribution action writes to `db.sendLog` so the SM has a record of
 * what went out, when, and to whom.
 */
export default function DistributePanel({
  productionId,
  artifactLabel,
  filename,
  defaultSubject,
  defaultBody,
  generatePdf,
}: Props) {
  const contactGroups = useContactGroups(productionId)
  const contacts = useContacts(productionId)
  const [groupId, setGroupId] = useState<string>('all')
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState(defaultBody)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'pdf' | 'mailto' | 'share' | null>(null)

  const recipients = useMemo(
    (): ResolvedRecipients =>
      resolveRecipients(groupId, contactGroups, contacts),
    [groupId, contactGroups, contacts],
  )

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function'

  async function ensurePdf(): Promise<{ blob: Blob; url: string }> {
    if (pdfBlob && pdfUrl) return { blob: pdfBlob, url: pdfUrl }
    setBusy('pdf')
    try {
      const blob = await generatePdf()
      const url = URL.createObjectURL(blob)
      setPdfBlob(blob)
      setPdfUrl(url)
      return { blob, url }
    } finally {
      setBusy(null)
    }
  }

  async function downloadPdf() {
    setError(null)
    try {
      const { url } = await ensurePdf()
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setStatus(`PDF downloaded: ${filename}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function openInMailClient() {
    setError(null)
    setStatus(null)
    if (recipients.count === 0) {
      setError(
        'No email addresses in the selected group. Add emails on contacts first.',
      )
      return
    }
    setBusy('mailto')
    try {
      // Make sure the PDF is generated and downloaded first so it's ready to
      // drag-attach. mailto: itself cannot carry attachments.
      await downloadPdf()

      const params = new URLSearchParams()
      params.set('bcc', recipients.emails.join(','))
      params.set('subject', subject)
      params.set('body', body)
      const url = `mailto:?${params.toString()}`
      window.location.href = url

      await logSend()
      setStatus(
        `Opened your mail client with ${recipients.count} BCC recipients. Drag the downloaded PDF into the compose window.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  async function shareViaSystem() {
    setError(null)
    setStatus(null)
    setBusy('share')
    try {
      const { blob } = await ensurePdf()
      const file = new File([blob], filename, { type: 'application/pdf' })
      if (!navigator.canShare?.({ files: [file] })) {
        setError(
          "Your device's share sheet can't accept PDF files. Use 'Open in mail client' instead.",
        )
        return
      }
      await navigator.share({
        title: subject,
        text: body,
        files: [file],
      })
      await logSend()
      setStatus('Shared via system share sheet.')
    } catch (err) {
      // AbortError = user cancelled, not really an error.
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus(null)
      } else {
        setError(err instanceof Error ? err.message : String(err))
      }
    } finally {
      setBusy(null)
    }
  }

  async function logSend() {
    await db.sendLog.add({
      productionId,
      sentAt: new Date().toISOString(),
      artifact: artifactLabel,
      recipientGroup: recipients.label,
      recipientCount: recipients.count,
      pdfFilename: filename,
    })
  }

  return (
    <div className="space-y-4 rounded border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-900/50">
      <div>
        <h4 className="font-serif text-lg font-semibold">Distribute</h4>
        <p className="text-xs text-stone-500">
          Generates a PDF and opens your mail client with the recipient group
          BCC'd. Then you drag the PDF into the compose window. On mobile,
          'Share' attaches the PDF for you.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Field label="Recipient group">
          <Select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value="all">
              All contacts with email ({countAll(contacts)})
            </option>
            {contactGroups.map((g) => (
              <option key={g.id} value={String(g.id)}>
                {g.name} ({countInGroup(g, contacts)})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Will BCC">
          <Input value={`${recipients.count} address(es)`} readOnly />
        </Field>
      </div>

      <Field label="Subject">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
      </Field>
      <Field label="Body">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
        />
      </Field>

      <div className="flex flex-wrap gap-3">
        <Button onClick={downloadPdf} disabled={busy !== null}>
          {busy === 'pdf' ? 'Generating…' : 'Download PDF'}
        </Button>
        <Button
          variant="secondary"
          onClick={openInMailClient}
          disabled={busy !== null || recipients.count === 0}
        >
          {busy === 'mailto' ? 'Opening…' : 'Open in mail client (BCC group)'}
        </Button>
        {canShareFiles && (
          <Button
            variant="secondary"
            onClick={shareViaSystem}
            disabled={busy !== null}
          >
            {busy === 'share' ? 'Sharing…' : 'Share via system…'}
          </Button>
        )}
      </div>

      {status && (
        <p className="text-sm text-green-700 dark:text-green-400">{status}</p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">⚠ {error}</p>
      )}
    </div>
  )
}

function countAll(contacts: Contact[]): number {
  return contacts.filter(
    (c) => !c.doNotPublish && c.email && c.email.trim().length > 0,
  ).length
}

function countInGroup(group: ContactGroup, contacts: Contact[]): number {
  const ids = new Set(group.contactIds)
  return contacts.filter(
    (c) =>
      c.id !== undefined &&
      ids.has(c.id) &&
      !c.doNotPublish &&
      c.email &&
      c.email.trim().length > 0,
  ).length
}

function resolveRecipients(
  groupId: string,
  groups: ContactGroup[],
  contacts: Contact[],
): ResolvedRecipients {
  let list: Contact[]
  let label: string
  if (groupId === 'all') {
    list = contacts
    label = 'All contacts'
  } else {
    const group = groups.find((g) => String(g.id) === groupId)
    if (!group) return { emails: [], count: 0, label: '(unknown)' }
    const ids = new Set(group.contactIds)
    list = contacts.filter((c) => c.id !== undefined && ids.has(c.id))
    label = group.name
  }
  const emails = list
    .filter((c) => !c.doNotPublish)
    .map((c) => c.email?.trim())
    .filter((e): e is string => !!e && e.length > 0)
  return { emails, count: emails.length, label }
}
