import { createRoot } from 'react-dom/client'
import { htmlDir, htmlLang, type Lang } from '@office-cc/i18n'
import App from './App'
import { LocaleProvider } from './i18n/locale'
import type { UiTheme } from '../shared/ipc'
import '@office-cc/ui/tokens.css'
import '@office-cc/ui/screentip.css'
import '@office-cc/ui/ai-model-picker.css'
import '@office-cc/ui/ai-queue-strip.css'
import '@office-cc/ui/ai-usage.css'
import '@office-cc/ui/color-picker.css'
import '@office-cc/ui/dropdown.css'
import '@office-cc/ui/ribbon-collapse.css'
import '@office-cc/ui/markdown.css'
import '@office-cc/ui/ai-panel-prefs.css'
import '@office-cc/ui/ai-scope-quote.css'
import './styles.css'
import { applyAiPanelPrefs, installScreenTips } from '@office-cc/ui'

installScreenTips()

function applyTheme(theme: UiTheme): void {
  if (theme === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', theme)
}

void (async () => {
  const [lang, theme] = await Promise.all([
    window.pdfApi.getLanguage().catch(() => 'zh' as const),
    window.pdfApi.getTheme().catch(() => 'system' as const),
  ])
  document.documentElement.lang = htmlLang(lang as Lang)
  document.documentElement.dir = htmlDir(lang)
  applyTheme(theme)
  window.pdfApi.onThemeChanged(applyTheme)
  await window.pdfApi
    ?.getAiPanelPrefs?.()
    .then(applyAiPanelPrefs)
    .catch(() => {})
  window.pdfApi?.onAiPanelPrefsChanged?.(applyAiPanelPrefs)
  createRoot(document.getElementById('root')!).render(
    <LocaleProvider initial={lang}>
      <App />
    </LocaleProvider>,
  )
})()
