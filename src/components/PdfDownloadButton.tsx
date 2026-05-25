import { useState } from 'react'
import { Button } from '@/components/Form'

interface Props {
  label: string
  filename: string
  generate: () => Promise<Blob>
}

/**
 * Generic "download a PDF" button that defers loading of @react-pdf/renderer
 * (and the PDF component itself) until the user actually clicks. Keeps PDF
 * code out of the initial bundle.
 *
 * Pass a `generate` function that returns a Blob. Typically that function
 * dynamically imports `@react-pdf/renderer` and the PDF component, then calls
 * `pdf(<Component {...props} />).toBlob()`.
 */
export default function PdfDownloadButton({ label, filename, generate }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setBusy(true)
    setError(null)
    try {
      const blob = await generate()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button onClick={handleClick} disabled={busy}>
        {busy ? 'Generating…' : label}
      </Button>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">⚠ {error}</p>
      )}
    </div>
  )
}
