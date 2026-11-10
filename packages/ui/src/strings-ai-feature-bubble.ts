import type { Lang } from '@office-cc/i18n'

/** Labels for the AI feature entry bar at the top of every editor's AI panel. */
export interface AiFeatureBubbleLabels {
  /** the trigger row's caption */
  title: string
  /** trigger tooltip while the bubble is hidden */
  expand: string
  /** trigger tooltip while the bubble is shown */
  collapse: string
}

export const AI_FEATURE_BUBBLE_LABELS: Record<Lang, AiFeatureBubbleLabels> = {
  zh: { title: 'AI 功能', expand: '展开功能按钮', collapse: '收起功能按钮' },
  en: {
    title: 'AI features',
    expand: 'Show the feature buttons',
    collapse: 'Hide the feature buttons',
  },
  'zh-TW': { title: 'AI 功能', expand: '展開功能按鈕', collapse: '收起功能按鈕' },
  ja: { title: 'AI 機能', expand: '機能ボタンを表示', collapse: '機能ボタンを隠す' },
  ko: { title: 'AI 기능', expand: '기능 버튼 표시', collapse: '기능 버튼 숨기기' },
  fr: { title: 'Fonctions IA', expand: 'Afficher les boutons', collapse: 'Masquer les boutons' },
  de: {
    title: 'KI-Funktionen',
    expand: 'Schaltflächen einblenden',
    collapse: 'Schaltflächen ausblenden',
  },
  es: { title: 'Funciones de IA', expand: 'Mostrar los botones', collapse: 'Ocultar los botones' },
  pt: { title: 'Funções de IA', expand: 'Mostrar os botões', collapse: 'Ocultar os botões' },
  it: { title: 'Funzioni IA', expand: 'Mostra i pulsanti', collapse: 'Nascondi i pulsanti' },
  pl: { title: 'Funkcje AI', expand: 'Pokaż przyciski', collapse: 'Ukryj przyciski' },
  cs: { title: 'Funkce AI', expand: 'Zobrazit tlačítka', collapse: 'Skrýt tlačítka' },
  nl: { title: 'AI-functies', expand: 'Knoppen tonen', collapse: 'Knoppen verbergen' },
  ms: { title: 'Ciri AI', expand: 'Papar butang ciri', collapse: 'Sembunyi butang ciri' },
  id: { title: 'Fitur AI', expand: 'Tampilkan tombol fitur', collapse: 'Sembunyikan tombol fitur' },
  ru: { title: 'Функции ИИ', expand: 'Показать кнопки', collapse: 'Скрыть кнопки' },
  th: { title: 'ฟีเจอร์ AI', expand: 'แสดงปุ่มฟีเจอร์', collapse: 'ซ่อนปุ่มฟีเจอร์' },
  ar: { title: 'مزايا الذكاء الاصطناعي', expand: 'إظهار الأزرار', collapse: 'إخفاء الأزرار' },
  he: { title: 'יכולות AI', expand: 'הצג את הכפתורים', collapse: 'הסתר את הכפתורים' },
  hi: { title: 'AI फ़ीचर', expand: 'फ़ीचर बटन दिखाएँ', collapse: 'फ़ीचर बटन छिपाएँ' },
  vi: { title: 'Tính năng AI', expand: 'Hiện nút tính năng', collapse: 'Ẩn nút tính năng' },
}
