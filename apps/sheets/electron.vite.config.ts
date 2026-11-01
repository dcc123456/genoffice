import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

export default defineConfig({
  main: {
    // @office-cc/* workspace packages ship TS source (no build step, no
    // compiled entry point) — externalizing them makes Node's ESM loader try
    // to resolve their relative imports at runtime and fail. Bundle those;
    // externalize everything else (Electron, zod, node builtins).
    plugins: [
      externalizeDepsPlugin({
        exclude: [
          '@office-cc/ai-provider',
          '@office-cc/agent-core',
          '@office-cc/ai-search',
          '@office-cc/docx-engine',
          '@office-cc/file-parse',
          '@office-cc/electron-utils',
          '@office-cc/i18n',
          '@office-cc/pptx-render',
          '@office-cc/xlsx-gateway',
        ],
      }),
    ],
  },
  preload: {
    // Sandboxed preload scripts cannot require arbitrary npm packages at
    // runtime, so the drop-open bridge must be bundled, not externalized.
    plugins: [externalizeDepsPlugin({ exclude: ['@office-cc/electron-utils'] })],
  },
  renderer: {
    plugins: [react()],
  },
})
