import { useEffect, useState } from 'react'

interface Props {
  /** The element to listen to / scroll. Defaults to the page's <main>
   *  (Standby's layout puts the scrollable region there, not on body). */
  target?: HTMLElement | null
  /** Scroll distance in pixels before the button appears. */
  threshold?: number
}

/**
 * Floating back-to-top button. Appears once the scroll container has
 * gone past `threshold` pixels; clicking scrolls smoothly to the top.
 *
 * Standby's main content lives inside a `<main className="overflow-y-
 * auto">` (not on body), so this listens to that element's scroll
 * events. If no target is passed, it auto-finds the first `<main>`.
 *
 * Respects `prefers-reduced-motion`: jumps instantly rather than
 * smooth-scrolling for users who don't want motion.
 */
export default function BackToTop({ target, threshold = 400 }: Props) {
  const [visible, setVisible] = useState(false)
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const el = target ?? document.querySelector('main')
    setScrollEl(el)
  }, [target])

  useEffect(() => {
    if (!scrollEl) return
    const onScroll = () => setVisible(scrollEl.scrollTop > threshold)
    onScroll()
    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    return () => scrollEl.removeEventListener('scroll', onScroll)
  }, [scrollEl, threshold])

  function scrollToTop() {
    if (!scrollEl) return
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    scrollEl.scrollTo({
      top: 0,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }

  if (!visible) return null

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={scrollToTop}
      className="fixed bottom-5 right-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-surface-border bg-card text-[rgb(var(--text-primary))] shadow-lg transition hover:bg-surface-border/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))] print:hidden"
    >
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 16V4" />
        <path d="M5 9l5-5 5 5" />
      </svg>
    </button>
  )
}
