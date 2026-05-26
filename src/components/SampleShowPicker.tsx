import { useState } from 'react'
import { Button } from '@/components/Form'
import {
  loadSampleShow,
  sampleShowUrl,
  SAMPLE_SHOWS,
  type SampleShow,
} from '@/lib/sample-show'
import { useAppStore } from '@/lib/store'

/**
 * Surfaces the bundled sample shows for one-click loading. Lives on the
 * Production empty state — the audit flagged it as confusing on a
 * fully-populated Production page (the SM already has a production;
 * sample shows are a first-run / training-new-SMs concern).
 *
 * If `compact` is true the heading and intro paragraph are dropped, for
 * cases where the surrounding container provides its own framing.
 */
interface Props {
  compact?: boolean
}

export default function SampleShowPicker({ compact = false }: Props) {
  const setCurrentProductionId = useAppStore((s) => s.setCurrentProductionId)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)

  async function handleLoadSample(sample: SampleShow) {
    setError(null)
    setStatus(null)
    setLoadingSlug(sample.slug)
    try {
      const newId = await loadSampleShow(sample)
      setCurrentProductionId(newId)
      // Sample labels already include the leading article ("A Midsummer
      // Night's Dream", "The Pirates of Penzance"), so we drop "the"
      // here to avoid "Loaded the The Pirates of Penzance".
      setStatus(
        `Loaded ${sample.label} as a new production and switched to it.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoadingSlug(null)
    }
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="space-y-2">
          <h3 className="font-display text-lg">Or try a sample show</h3>
          <p className="text-sm text-muted">
            Each sample imports as a brand-new production alongside whatever
            you already have. Useful for kicking the tires, training a new
            SM, or seeing what a fully-populated production looks like
            before starting your own.
          </p>
        </div>
      )}
      <ul className="space-y-3">
        {SAMPLE_SHOWS.map((sample) => {
          const busy = loadingSlug === sample.slug
          const disabled = loadingSlug !== null && !busy
          return (
            <li
              key={sample.slug}
              className="space-y-2 rounded border border-surface-border bg-card p-3"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <h4 className="font-display text-base">{sample.label}</h4>
                <span className="rounded bg-surface-border/40 px-2 py-0.5 text-xs uppercase tracking-wide text-muted">
                  {sample.tag}
                </span>
              </div>
              <p className="text-sm text-muted">{sample.description}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => void handleLoadSample(sample)}
                  disabled={disabled || busy}
                >
                  {busy ? 'Loading…' : `Load ${sample.label}`}
                </Button>
                <a
                  href={sampleShowUrl(sample)}
                  download={`${sample.slug}.standby.json`}
                  className="text-sm text-muted underline hover:text-accent"
                >
                  …or download the JSON to inspect it
                </a>
              </div>
            </li>
          )
        })}
      </ul>
      {status && (
        <p className="text-sm text-green-700 dark:text-green-400">{status}</p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">⚠ {error}</p>
      )}
    </div>
  )
}
