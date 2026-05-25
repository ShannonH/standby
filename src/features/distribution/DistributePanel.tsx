import { useMemo, useState } from 'react'
import {
  Button,
  Checkbox,
  Field,
  Input,
  Select,
  Textarea,
} from '@/components/Form'
import { db, type Contact, type ContactGroup } from '@/lib/db'
import { useContactGroups, useContacts } from '@/lib/hooks'
import { buildMailtoUrl } from '@/lib/mailto'

interface Props {
  productionId: number
  /** Short human-readable label for the artifact, used in the send log. */
  artifactLabel: string
  /** Suggested filename for the PDF download. */
  filename: string
  /** Pre-filled email subject line. */
  defaultSubject: string
  /** Pre-filled email body (the intro / sign-off prose). */
  defaultBody: string
  /** Plain-text version of the full artifact. When provided, the panel
   *  shows a toggle (default ON) to append this to the email body so the
   *  recipient sees the report inline instead of having to open the PDF.
   *  This matches SM convention — rehearsal reports go in the body. */
  inlineBody?: string
  /** Lazy-builds the PDF as a Blob when "Download PDF" or "Share" is clicked. */
  generatePdf: () => Promise<Blob>
}

interface ResolvedRecipients {
  emails: string[]
  count: number
  label: string
}

/** Rough URL-length budget above which most mail clients start to choke.
 *  Outlook is the harshest at ~2000 chars; Apple Mail and Gmail accept much
 *  more. Pick 6000 as a balance — gives a warning before things truncate. */
const MAILTO_LENGTH_WARN = 6000

/**
 * Reusable distribution panel.
 *
 *   1. Download the artifact as a PDF.
 *   2. Pick a contact group (or "All contacts with email").
 *   3. Open the user's mail client via mailto: with the group BCC'd, subject
 *      pre-filled, and body pre-filled. When inlineBody is provided and the
 *      toggle is on, the full report text is appended to the body so the
 *      recipient sees the report inline. This matches SM convention — the
 *      rehearsal report has always been distributed in the email body; the
 *      PDF is the archival/formal version.
 *   4. On mobile, use the Web Share API to share the PDF natively.
 *
 * Every distribution action writes to `db.sendLog`.
 */
export default function DistributePanel({
  productionId,
  artifactLabel,
  filename,
  defaultSubject,
  defaultBody,
  inlineBody,
  generatePdf,
}: Props) {
  const contactGroups = useContactGroups(productionId)
  const contacts = useContacts(productionId)
  const [groupId, setGroupId] = useState<string>('all')
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState(defaultBody)
  const [includeInline, setIncludeInline] = useState(true)
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

  const effectiveBody = useMemo(
    () =>
      inlineBody && includeInline ? `${body}\n\n${inlineBody}` : body,
    [body, inlineBody, includeInline],
  )

  const encodedLength = useMemo(
    () =>
      encodeURIComponent(effectiveBody).length +
      encodeURIComponent(subject).length +
      recipients.emails.join(',').length +
      40,
    [effectiveBody, subject, recipients.emails],
  )

  const tooLong = encodedLength > MAILTO_LENGTH_WARN

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
      // If the body contains the full report, the recipient doesn't strictly
      // need the PDF. Skip the auto-download to avoid an unsolicited file
      // sitting in the user's Downloads folder. They can use "Download PDF"
      // explicitly when they want one.
      if (!inlineBody || !includeInline) {
        await downloadPdf()
      }

      const url = buildMailtoUrl(recipients.emails, subject, effectiveBody)
      window.location.href = url

      await logSend()
      setStatus(
        inlineBody && includeInline
          ? `Opened mail client with ${recipients.count} BCC recipients. Full report is in the email body — no attachment needed.`
          : `Opened mail client with ${recipients.count} BCC recipients. Drag the downloaded PDF into the compose window.`,
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
        text: effectiveBody,
        files: [file],
      })
      await logSend()
      setStatus('Shared via system share sheet.')
    } catch (err) {
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
    <div className="space-y-4 rounded border border-surface-border bg-card p-4">
      <div>
        <h4 className="font-serif text-lg font-semibold">Distribute</h4>
        <p className="text-xs text-muted">
          Generates a PDF and opens your mail client with the recipient group
          BCC'd. By default, the full report is included in the email body so
          you don't have to attach the PDF — but the PDF download is always
          available for archival or formal handoff.
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
      <Field
        label={inlineBody ? 'Body — intro / sign-off' : 'Body'}
        hint={
          inlineBody
            ? 'Goes above the report content. Customize the greeting or add a note.'
            : undefined
        }
      >
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
        />
      </Field>

      {inlineBody !== undefined && (
        <div className="space-y-2">
          <Checkbox
            checked={includeInline}
            onChange={(e) => setIncludeInline(e.target.checked)}
            label="Include the full report in the email body (recipients see it inline — no attachment needed)"
          />
          {includeInline && (
            <details
              open
              className="rounded border border-surface-border bg-card"
            >
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                Preview of what's appended to the email body
              </summary>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words border-t border-surface-border p-3 font-mono text-xs leading-relaxed">
                {inlineBody}
              </pre>
            </details>
          )}
        </div>
      )}

      <p
        className={`text-xs ${
          tooLong
            ? 'text-amber-700 dark:text-amber-400'
            : 'text-muted'
        }`}
      >
        Email URL length: ~{encodedLength.toLocaleString()} chars
        {tooLong && (
          <>
            {' '}
            — Outlook and some older clients may truncate. Consider unchecking
            "include full report in body" and sending the PDF as an
            attachment instead.
          </>
        )}
      </p>

      <div className="flex flex-wrap gap-3">
        <Button onClick={downloadPdf} disabled={busy !== null}>
          {busy === 'pdf' ? 'Generating…' : 'Download PDF'}
        </Button>
        <Button
          variant="secondary"
          onClick={openInMailClient}
          disabled={busy !== null || recipients.count === 0}
        >
          {busy === 'mailto'
            ? 'Opening…'
            : inlineBody && includeInline
              ? 'Open in mail client (BCC + inline report)'
              : 'Open in mail client (BCC group)'}
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
