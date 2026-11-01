import { createRoot } from 'react-dom/client'
import { htmlDir, htmlLang, type Lang } from '@office-cc/i18n'
import App from './App'
import { LocaleProvider } from './i18n/locale'
import type { DocTheme, UiTheme } from '../shared/ipc'
import '@office-cc/ui/tokens.css'
import '@office-cc/ui/screentip.css'
import '@office-cc/ui/ai-model-picker.css'
import '@office-cc/ui/ai-queue-strip.css'
import '@office-cc/ui/ai-usage.css'
import '@office-cc/ui/dropdown.css'
import '@office-cc/ui/find-panel.css'
import '@office-cc/ui/ribbon-collapse.css'
import '@office-cc/ui/markdown.css'
import '@office-cc/ui/ai-panel-prefs.css'
import '@office-cc/ui/ai-scope-quote.css'
import '@office-cc/ui/image-viewer.css'
import 'katex/dist/katex.min.css'
import './styles.css'
import './markdown-themes.css'
import { applyAiPanelPrefs, installScreenTips } from '@office-cc/ui'
import type { MarkdownTheme } from '../shared/markdown-theme'

installScreenTips()

function applyTheme(theme: UiTheme): void {
  if (theme === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', theme)
}

function applyMarkdownTheme(theme: MarkdownTheme): void {
  // a picked paper theme overrides the light/dark document theme for the paper
  if (theme === 'default') document.documentElement.removeAttribute('data-markdown-theme')
  else document.documentElement.setAttribute('data-markdown-theme', theme)
}

function applyDocumentTheme(theme: DocTheme): void {
  // data-doc-theme drives the preview paper (officecc#1811); absent means 'follow' the UI theme
  if (theme === 'follow') document.documentElement.removeAttribute('data-doc-theme')
  else document.documentElement.setAttribute('data-doc-theme', theme)
}

void (async () => {
  const [lang, theme, docTheme, mdTheme] = await Promise.all([
    window.markdownApi.getLanguage().catch(() => 'zh' as const),
    window.markdownApi.getTheme().catch(() => 'system' as const),
    window.markdownApi.getDocumentTheme?.().catch(() => 'follow' as const),
    window.markdownApi.getMarkdownTheme?.().catch(() => 'default' as const),
  ])
  document.documentElement.lang = htmlLang(lang as Lang)
  document.documentElement.dir = htmlDir(lang)
  applyTheme(theme)
  applyDocumentTheme(docTheme ?? 'follow')
  applyMarkdownTheme(mdTheme)
  window.markdownApi.onThemeChanged(applyTheme)
  window.markdownApi.onDocumentThemeChanged?.(applyDocumentTheme)
  await window.markdownApi
    ?.getAiPanelPrefs?.()
    .then(applyAiPanelPrefs)
    .catch(() => {})
  window.markdownApi?.onAiPanelPrefsChanged?.(applyAiPanelPrefs)
  createRoot(document.getElementById('root')!).render(
    <LocaleProvider initial={lang}>
      <App />
    </LocaleProvider>,
  )
})()
