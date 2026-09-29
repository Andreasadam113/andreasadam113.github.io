import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // '/' locally and for a <user>.github.io site; '/<repo>/' for a project site.
  // The GitHub Pages workflow sets BASE_PATH from the repository name.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  server: {
    // dev only: never let the browser reuse stale modules/CSS after a reload
    headers: { 'Cache-Control': 'no-store' },
    // the native file watcher sometimes misses quick successive edits on Windows,
    // which leaves stale modules in the dev server; polling is slower but reliable
    watch: { usePolling: true, interval: 200 },
  },
  build: {
    // the lazily loaded 3D chunk (three.js + scene) is expected to be ~1 MB before gzip
    chunkSizeWarningLimit: 1100,
  },
})
