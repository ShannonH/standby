/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** GoatCounter site code for anonymous pageview counting. Set only by
   *  the GitHub Pages deploy workflow; absent in Docker / self-host
   *  builds and local dev, which disables analytics entirely. See
   *  src/lib/analytics.ts. */
  readonly VITE_GOATCOUNTER_CODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
