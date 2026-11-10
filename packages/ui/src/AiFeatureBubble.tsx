/**
 * The AI feature entries at the top of every editor's expanded AI panel: a
 * trigger row that you CLICK to open a bubble holding the feature buttons
 * themselves — the buttons live inside the bubble, so no hover text and no
 * descriptions are involved. Open by default; the choice persists per app.
 *
 * Items are supplied by the app (label, icon, action), so this component stays
 * editor-agnostic and invents no command of its own.
 */
import { useCallback, useId, useState } from 'react'
import { IconChevronDown } from './icons'
import type { AiFeatureBubbleLabels } from './strings-ai-feature-bubble'

export interface AiFeatureBubbleItem {
  readonly id: string
  readonly label: string
  /** the app's own glyph; omit for a text-only button */
  readonly icon?: React.ReactNode
  readonly disabled?: boolean
  readonly select: () => void
}

export interface AiFeatureBubbleProps {
  readonly items: readonly AiFeatureBubbleItem[]
  readonly labels: AiFeatureBubbleLabels
  /** localStorage key holding `'0'` once the user has collapsed the bubble */
  readonly storageKey?: string
  readonly defaultOpen?: boolean
}

function readBubbleOpen(storageKey: string | undefined, fallback: boolean): boolean {
  if (!storageKey) return fallback
  try {
    const raw = localStorage.getItem(storageKey)
    return raw === null ? fallback : raw !== '0'
  } catch {
    return fallback
  }
}

function writeBubbleOpen(storageKey: string | undefined, open: boolean): void {
  if (!storageKey) return
  try {
    localStorage.setItem(storageKey, open ? '1' : '0')
  } catch {
    /* private mode / quota: the toggle still works for this session */
  }
}

export function AiFeatureBubble({
  items,
  labels,
  storageKey,
  defaultOpen = true,
}: AiFeatureBubbleProps): React.JSX.Element | null {
  const [open, setOpen] = useState(() => readBubbleOpen(storageKey, defaultOpen))
  const bubbleId = useId()

  const toggle = useCallback(() => {
    setOpen((prev) => {
      writeBubbleOpen(storageKey, !prev)
      return !prev
    })
  }, [storageKey])

  if (items.length === 0) return null

  return (
    <div className="ai-feature-entry" role="group" aria-label={labels.title}>
      <button
        type="button"
        className="ai-feature-trigger"
        aria-expanded={open}
        aria-controls={bubbleId}
        title={open ? labels.collapse : labels.expand}
        onClick={toggle}
      >
        <span className="ai-feature-trigger-label">{labels.title}</span>
        <span className="ai-feature-caret" aria-hidden="true">
          <IconChevronDown size={14} />
        </span>
      </button>
      {open && (
        <div id={bubbleId} className="ai-feature-bubble">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="ai-feature-btn"
              disabled={item.disabled}
              onClick={item.select}
            >
              {item.icon ? <span className="ai-feature-btn-icon">{item.icon}</span> : null}
              <span className="ai-feature-btn-label">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
