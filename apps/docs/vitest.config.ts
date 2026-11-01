import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// resolve sibling source packages by path (not via node_modules), so a git
// worktree whose node_modules is linked to another checkout still tests
// against this checkout's edits (same convention as packages/pdf2docx)
const local = (rel: string) => fileURLToPath(new URL(rel, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@office-cc/docx-engine/lazy-media': local('../../packages/docx-engine/src/lazy-media.ts'),
      '@office-cc/docx-engine': local('../../packages/docx-engine/src/index.ts'),
      '@office-cc/font-metrics': local('../../packages/font-metrics/src/index.ts'),
      // subpath before the bare name: string aliases are prefix replacements
      '@office-cc/electron-utils/headless-export': local(
        '../../packages/electron-utils/src/headless-export.ts',
      ),
      '@office-cc/electron-utils/atomic-write': local(
        '../../packages/electron-utils/src/atomic-write.ts',
      ),
      '@office-cc/electron-utils/safe-external-url': local(
        '../../packages/electron-utils/src/safe-external-url.ts',
      ),
      '@office-cc/electron-utils/print-job': local(
        '../../packages/electron-utils/src/print-job.ts',
      ),
      '@office-cc/electron-utils': local('../../packages/electron-utils/src/index.ts'),
      '@office-cc/ai-provider/browser': local('../../packages/ai-provider/src/browser.ts'),
      '@office-cc/ai-provider': local('../../packages/ai-provider/src/index.ts'),
      '@office-cc/i18n': local('../../packages/i18n/src/index.ts'),
      '@office-cc/ui': local('../../packages/ui/src/index.ts'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
    testTimeout: 20000,
  },
})
