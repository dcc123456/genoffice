import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const here = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@office-cc/pptx-engine/table-grid': resolve(here, '../pptx-engine/src/table-grid.ts'),
      '@office-cc/pptx-engine/identity': resolve(here, '../pptx-engine/src/identity.ts'),
      '@office-cc/pptx-engine/background-promote': resolve(
        here,
        '../pptx-engine/src/background-promote.ts',
      ),
      '@office-cc/pptx-engine/custgeom': resolve(here, '../pptx-engine/src/custgeom.ts'),
      '@office-cc/pptx-engine': resolve(here, '../pptx-engine/src/index.ts'),
      '@office-cc/pptx-render/preset-geometry': resolve(
        here,
        '../pptx-render/src/preset-geometry.ts',
      ),
      '@office-cc/pptx-render': resolve(here, '../pptx-render/src/index.ts'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
