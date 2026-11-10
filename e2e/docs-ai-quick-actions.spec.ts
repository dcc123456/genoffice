import { test, expect } from '@playwright/test'
import { launchShell, closeAndSaveVideo, waitForPageWithUrl } from './helpers'

/**
 * The AI feature entries (总结 / 润色 / 排版 / 生成 / 思维导图) left the Home ribbon
 * for the expanded AI panel, where an Office-style ScreenTip carries the name and
 * the request. In the real renderer, because the row has to survive the panel's
 * narrowest width and the bubble is the labelling mechanism the buttons rely on.
 */
test.describe('the AI quick actions in the expanded panel', () => {
  test('the panel holds the entries, the ribbon holds only the assistant', async () => {
    test.setTimeout(300_000)
    const launched = await launchShell({ videoDir: 'docs-ai-quick-actions' })
    try {
      await expect(launched.page.locator('.quick-card').first()).toContainText('AI Docs')
      await launched.page.locator('.quick-card').first().click()
      const editor = await waitForPageWithUrl(launched.app, '://docs/')
      await expect(editor.locator('.ai-composer textarea')).toBeVisible({ timeout: 30_000 })

      const row = editor.locator('.ai-quick-actions')
      const buttons = row.locator('.ai-quick-btn')
      await expect(buttons).toHaveCount(5)
      // every entry titles its bubble and the bubble spells out the request
      for (let i = 0; i < 5; i++) {
        const button = buttons.nth(i)
        await expect(button).toHaveAttribute('data-tip', /.+/)
        await expect(button).toHaveAttribute('data-tip-detail', /.+/)
      }
      // what is left on the ribbon is the entry that opens this panel, nothing else
      await expect(editor.locator('.ribbon .ai-entry')).toHaveCount(1)

      // the row wraps instead of overflowing: at the panel's default width every
      // button still sits inside it
      const rowBox = (await row.boundingBox())!
      for (let i = 0; i < 5; i++) {
        const box = (await buttons.nth(i).boundingBox())!
        expect(box.x).toBeGreaterThanOrEqual(rowBox.x - 1)
        expect(box.x + box.width).toBeLessThanOrEqual(rowBox.x + rowBox.width + 1)
      }

      // the bubble is the label the buttons carry: hover arms it after 500ms and
      // it auto-hides after 5s, so read all of it in one go
      const first = buttons.first()
      const tipText = await first.getAttribute('data-tip')
      await first.hover()
      const tip = editor.locator('#ui-screentip')
      await expect(tip).toBeVisible({ timeout: 3_000 })
      await expect(editor.locator('.ui-screentip-name')).toHaveText(tipText ?? '')
      await expect(editor.locator('.ui-screentip-detail')).not.toBeEmpty()
      await expect(tip).toHaveAttribute('role', 'tooltip')

      // an empty document keeps the row but greys what has no text to work on
      await expect(row.locator('.ai-quick-btn:disabled')).toHaveCount(4)
      await expect(row.locator('.ai-quick-btn:not(:disabled)')).toHaveCount(1)
    } finally {
      await closeAndSaveVideo(launched, 'docs-ai-quick-actions')
    }
  })
})
