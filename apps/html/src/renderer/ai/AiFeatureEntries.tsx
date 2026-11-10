import type { ReactNode } from 'react'
import { IconPalette, IconSummarize, IconWand } from '../components/icons'
import { t as tGlobal, type StringKey } from '../i18n/locale'

/** The look directions 主题 offers, each its own request to the model. */
const THEME_DIRECTIONS: StringKey[] = [
  'aiThemeMinimal',
  'aiThemeEditorial',
  'aiThemeTech',
  'aiThemePlayful',
  'aiThemeDark',
]

/**
 * The AI feature entries, which live in the expanded panel now that they have
 * left the Home ribbon: the panel's trigger row clicks open a bubble holding
 * one button each. The theme directions were a submenu on the ribbon; inside a
 * click-to-open bubble each direction is a button of its own, so no second
 * level of menus is needed.
 */
export const HTML_FEATURE_ENTRIES: {
  id: string
  label: () => string
  icon: ReactNode
  prompt: () => string
}[] = [
  {
    id: 'restyle',
    label: () => tGlobal('aiRestyleBtn'),
    icon: <IconWand size={24} />,
    prompt: () => tGlobal('aiRestylePrompt'),
  },
  ...THEME_DIRECTIONS.map((key) => ({
    id: key,
    label: () => `${tGlobal('aiThemeBtn')} · ${tGlobal(key)}`,
    icon: <IconPalette size={24} />,
    prompt: () => tGlobal('aiThemePrompt', { direction: tGlobal(key) }),
  })),
  {
    id: 'summarize',
    label: () => tGlobal('aiSummarizeBtn'),
    icon: <IconSummarize size={24} />,
    prompt: () => tGlobal('aiSummarizePrompt'),
  },
]
