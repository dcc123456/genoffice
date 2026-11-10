// The AI feature entries left the Home ribbon for the expanded panel: a trigger
// row that clicks open a bubble, and the buttons themselves live in that bubble.
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Editor } from '@tiptap/core'
import { editorExtensions } from '../src/renderer/editor/extensions'
import { AiPanel } from '../src/renderer/ai/AiPanel'
import { t } from '../src/renderer/i18n/locale'
import { AI_PROVIDERS, type AiSettings } from '../src/shared/ipc'

const BUBBLE_KEY = 'docs-ai-feature-bubble'

const settings: AiSettings = {
  provider: 'anthropic',
  providers: Object.fromEntries(
    AI_PROVIDERS.map((p) => [p.id, { apiKey: '', model: p.defaultModel }]),
  ) as AiSettings['providers'],
}

function createEditor(): Editor {
  return new Editor({
    element: document.createElement('div'),
    extensions: editorExtensions,
    content: {
      type: 'doc',
      content: [
        {
          type: 'docParagraph',
          attrs: { docxIndex: 0 },
          content: [{ type: 'text', text: 'EVs market research' }],
        },
      ],
    },
  })
}

function mount(element: React.ReactElement): {
  container: HTMLElement
  cleanup: () => void
} {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root: Root = createRoot(container)
  act(() => root.render(element))
  return {
    container,
    cleanup: () => {
      act(() => root.unmount())
      container.remove()
    },
  }
}

function panelProps(editor: Editor, overrides: Record<string, unknown> = {}) {
  return { editor, blocks: [], settings, open: true, ...overrides }
}

function trigger(container: HTMLElement): HTMLButtonElement {
  const found = container.querySelector<HTMLButtonElement>('.ai-feature-trigger')
  if (!found) throw new Error('no AI feature trigger in the panel')
  return found
}

function featureButtons(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll<HTMLButtonElement>('.ai-feature-btn'))
}

function buttonByLabel(container: HTMLElement, label: string): HTMLButtonElement {
  const found = featureButtons(container).find((b) => b.textContent === label)
  if (!found) throw new Error(`no feature button titled ${label}`)
  return found
}

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0))

/** the send path needs a stream transport; a stub that answers nothing keeps the run offline */
function stubStream(): () => void {
  const w = window as unknown as Record<string, unknown>
  w.desktop = {
    onAiStream: () => () => {},
    aiStream: vi.fn(async () => ({ ok: true })),
    aiStreamCancel: vi.fn(async () => {}),
  }
  return () => {
    delete w.desktop
  }
}

beforeAll(() => {
  // jsdom's opaque origin has no localStorage; the panel reads its width at mount
  let store: Record<string, string> = {}
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v
      },
      removeItem: (k: string) => {
        delete store[k]
      },
      clear: () => {
        store = {}
      },
    },
  })
  Element.prototype.scrollTo ??= () => {}
})

describe('the AI feature bubble in the expanded panel', () => {
  it('opens by default and holds one button per entry', () => {
    const editor = createEditor()
    const { container, cleanup } = mount(createElement(AiPanel, panelProps(editor)))
    try {
      expect(trigger(container).getAttribute('aria-expanded')).toBe('true')
      expect(featureButtons(container).map((b) => b.textContent)).toEqual([
        t('aiSummarizeBtn'),
        t('aiPolishBtn'),
        t('aiTidyBtn'),
        t('aiGenerateBtn'),
        t('aiMindMapBtn'),
      ])
      for (const button of featureButtons(container)) {
        // the bubble shows the buttons, not a description of them
        expect(button.getAttribute('data-tip')).toBeNull()
        expect(button.disabled).toBe(false)
      }
    } finally {
      cleanup()
      editor.destroy()
    }
  })

  it('clicking the trigger collapses the bubble and remembers the choice', () => {
    const editor = createEditor()
    const { container, cleanup } = mount(createElement(AiPanel, panelProps(editor)))
    try {
      act(() => trigger(container).click())
      expect(trigger(container).getAttribute('aria-expanded')).toBe('false')
      expect(container.querySelectorAll('.ai-feature-btn').length).toBe(0)
      expect(localStorage.getItem(BUBBLE_KEY)).toBe('0')

      // a fresh panel honours the remembered state instead of re-opening
      cleanup()
      const second = mount(createElement(AiPanel, panelProps(editor)))
      try {
        expect(trigger(second.container).getAttribute('aria-expanded')).toBe('false')
        act(() => trigger(second.container).click())
        expect(featureButtons(second.container).length).toBe(5)
        expect(localStorage.getItem(BUBBLE_KEY)).toBe('1')
      } finally {
        second.cleanup()
      }
    } finally {
      cleanup()
      editor.destroy()
    }
  })

  it('greys the actions that need text on an empty document, leaving 生成 live', () => {
    const editor = createEditor()
    const { container, cleanup } = mount(
      createElement(AiPanel, panelProps(editor, { docEmpty: true })),
    )
    try {
      expect(
        featureButtons(container)
          .filter((b) => b.disabled)
          .map((b) => b.textContent),
      ).toEqual([t('aiSummarizeBtn'), t('aiPolishBtn'), t('aiTidyBtn'), t('aiMindMapBtn')])
      expect(buttonByLabel(container, t('aiGenerateBtn')).disabled).toBe(false)
    } finally {
      cleanup()
      editor.destroy()
    }
  })

  it('生成 hands the composer the lead-in instead of sending a topic-less request', () => {
    const editor = createEditor()
    const { container, cleanup } = mount(
      createElement(AiPanel, panelProps(editor, { docEmpty: true })),
    )
    try {
      act(() => buttonByLabel(container, t('aiGenerateBtn')).click())
      const textarea = container.querySelector<HTMLTextAreaElement>('.ai-input-box textarea')!
      expect(textarea.value).toBe(t('aiGeneratePrompt'))
      expect(container.querySelectorAll('.ai-msg').length).toBe(0)
    } finally {
      cleanup()
      editor.destroy()
    }
  })

  it('总结 sends its prompt as the user turn', async () => {
    const restoreStream = stubStream()
    const editor = createEditor()
    const { container, cleanup } = mount(createElement(AiPanel, panelProps(editor)))
    try {
      await act(async () => {
        buttonByLabel(container, t('aiSummarizeBtn')).click()
        await flush()
      })
      expect(container.querySelector('.ai-msg-user')?.textContent).toContain(t('aiSummarizePrompt'))
    } finally {
      cleanup()
      editor.destroy()
      restoreStream()
    }
  })

  it('targets the selection once text is selected', async () => {
    const restoreStream = stubStream()
    const editor = createEditor()
    const { container, cleanup } = mount(createElement(AiPanel, panelProps(editor)))
    try {
      act(() => editor.commands.setTextSelection({ from: 6, to: 10 }))
      await act(async () => {
        buttonByLabel(container, t('aiPolishBtn')).click()
        await flush()
      })
      const user = container.querySelector('.ai-msg-user')?.textContent ?? ''
      expect(user).toContain(t('aiPolishSelectionPrompt'))
      expect(user).not.toContain(t('aiPolishPrompt'))
    } finally {
      cleanup()
      editor.destroy()
      restoreStream()
    }
  })
})
