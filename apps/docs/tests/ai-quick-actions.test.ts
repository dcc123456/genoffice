// The AI feature entries left the Home ribbon for the expanded panel: icon buttons
// whose ScreenTip spells out the request, and a click that sends it.
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Editor } from '@tiptap/core'
import { editorExtensions } from '../src/renderer/editor/extensions'
import { AiPanel } from '../src/renderer/ai/AiPanel'
import { t } from '../src/renderer/i18n/locale'
import { AI_PROVIDERS, type AiSettings } from '../src/shared/ipc'

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

function quickButtons(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll<HTMLButtonElement>('.ai-quick-btn'))
}

function buttonByTip(container: HTMLElement, tip: string): HTMLButtonElement {
  const found = quickButtons(container).find((b) => b.getAttribute('data-tip') === tip)
  if (!found) throw new Error(`no quick action titled ${tip}`)
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

describe('the AI quick actions in the expanded panel', () => {
  it('carries one button per entry, each titled and described by its ScreenTip', () => {
    const editor = createEditor()
    const { container, cleanup } = mount(createElement(AiPanel, panelProps(editor)))
    try {
      const buttons = quickButtons(container)
      expect(buttons.map((b) => b.textContent)).toEqual([
        t('aiSummarizeBtn'),
        t('aiPolishBtn'),
        t('aiTidyBtn'),
        t('aiGenerateBtn'),
        t('aiMindMapBtn'),
      ])
      // the bubble's detail line is the request itself, so what it promises is what goes
      for (const button of buttons) {
        expect(button.getAttribute('data-tip-detail')).toBeTruthy()
        expect(button.disabled).toBe(false)
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
      const buttons = quickButtons(container)
      expect(buttons.filter((b) => b.disabled).map((b) => b.textContent)).toEqual([
        t('aiSummarizeBtn'),
        t('aiPolishBtn'),
        t('aiTidyBtn'),
        t('aiMindMapBtn'),
      ])
      expect(buttonByTip(container, t('aiGenerateBtn')).disabled).toBe(false)
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
      act(() => buttonByTip(container, t('aiGenerateBtn')).click())
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
        buttonByTip(container, t('aiSummarizeBtn')).click()
        await flush()
      })
      const first = container.querySelector('.ai-msg-user')
      expect(first?.textContent).toContain(t('aiSummarizePrompt'))
    } finally {
      cleanup()
      editor.destroy()
      restoreStream()
    }
  })

  it('targets the selection once text is selected, and the bubble says so', () => {
    const editor = createEditor()
    const { container, cleanup } = mount(createElement(AiPanel, panelProps(editor)))
    try {
      expect(buttonByTip(container, t('aiPolishBtn')).getAttribute('data-tip-detail')).toBe(
        t('aiPolishPrompt'),
      )
      act(() => editor.commands.setTextSelection({ from: 6, to: 10 }))
      expect(buttonByTip(container, t('aiPolishBtn')).getAttribute('data-tip-detail')).toBe(
        t('aiPolishSelectionPrompt'),
      )
    } finally {
      cleanup()
      editor.destroy()
    }
  })
})
