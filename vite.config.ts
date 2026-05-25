/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// Base path is parameterized so self-hosters (e.g. universities running
// Standby in Docker on their own domain at /) can override without forking.
// Default keeps the existing GitHub Pages deploy working unchanged.
const BASE_PATH = process.env.VITE_BASE_PATH ?? '/standby/'

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Standby — Stage Management Paperwork',
        short_name: 'Standby',
        description:
          'Free, offline-first paperwork hub for theatre stage managers.',
        theme_color: '#1f2937',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/standby/',
        scope: '/standby/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Include .json so bundled sample shows (public/samples/*.standby.json)
        // are precached and importable offline once the SW has caught them.
        // Include .woff so the script font used by the daily-call PDF
        // (registered via Font.register in DailyCallPdf.tsx) is available
        // offline.
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2,json}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
