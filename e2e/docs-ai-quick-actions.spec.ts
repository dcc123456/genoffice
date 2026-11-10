import { test, expect } from '@playwright/test'
import { launchShell, closeAndSaveVideo, screenshotPath, waitForPageWithUrl } from './helpers'

/**
 * The AI feature entries (summarize / polish / layout / generate / mind map) left
 * the Home ribbon for the top of the expanded AI panel: one trigger row clicks
 * open a bubble that holds the buttons themselves. In the real renderer, because
 * the row has to survive the panel's narrowest width and the collapse has to
 * persist across documents.
 */
test.describe('the AI feature bubble in the expanded panel', () => {
  test('the bubble holds the entries and the ribbon holds only the assistant', async () => {
    test.setTimeout(300_000)
    const launched = await launchShell({ videoDir: 'docs-ai-quick-actions' })
    try {
      await expect(launched.page.locator('.quick-card').first()).toContainText('AI Docs')
      await launched.page.locator('.quick-card').first().click()
      const editor = await waitForPageWithUrl(launched.app, '://docs/')
      await expect(editor.locator('.ai-composer textarea')).toBeVisible({ timeout: 30_000 })

      const entry = editor.locator('.ai-feature-entry')
      const trigger = editor.locator('.ai-feature-trigger')
      const buttons = editor.locator('.ai-feature-btn')
      // expanded by default, and the bubble is buttons, not prose
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      await expect(buttons).toHaveCount(5)
      // what is left on the ribbon is the entry that opens this panel, nothing else
      await expect(editor.locator('.ribbon .ai-entry')).toHaveCount(1)

      // the bubble wraps instead of overflowing: at the panel's default width every
      // button still sits inside it
      const bubbleBox = (await editor.locator('.ai-feature-bubble').boundingBox())!
      for (let i = 0; i < 5; i++) {
        const box = (await buttons.nth(i).boundingBox())!
        expect(box.x).toBeGreaterThanOrEqual(bubbleBox.x - 1)
        expect(box.x + box.width).toBeLessThanOrEqual(bubbleBox.x + bubbleBox.width + 1)
      }

      // an empty document keeps the bubble but greys what has no text to work on
      await expect(entry.locator('.ai-feature-btn:disabled')).toHaveCount(4)
      await expect(entry.locator('.ai-feature-btn:not(:disabled)')).toHaveCount(1)

      // clicking the trigger collapses it, clicking again reopens it
      await trigger.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await expect(buttons).toHaveCount(0)
      await trigger.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      await expect(buttons).toHaveCount(5)
      await editor.screenshot({ path: screenshotPath('docs-ai-feature-bubble') })
    } finally {
      await closeAndSaveVideo(launched, 'docs-ai-quick-actions')
    }
  })
})
