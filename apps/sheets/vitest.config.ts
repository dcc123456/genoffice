import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const here = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // the renderer imports @office-cc/ui, whose CSS pulls font assets from the
  // sibling package — allow reads outside this app so vite can serve them
  server: {
    fs: {
      allow: [resolve(here, '..', '..')],
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
