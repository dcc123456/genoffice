import { test, expect } from '@playwright/test'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { closeAndSaveVideo, launchShell, waitForPageWithUrl } from './helpers'

const SHEETS_BOOK = resolve(__dirname, '../apps/sheets/fixtures/generated/compatibility-basic.xlsx')
const SLIDES_DECK = resolve(
  __dirname,
  '../packages/pptx-engine/tests/fixtures/01_standard_business.pptx',
)

/**
 * The AI feature entries moved off every ribbon into the expanded panel, where the
 * trigger row clicks open a bubble holding the buttons themselves. These three
 * formats have no other coverage of that row, so each is checked in the real
 * renderer: it is the first thing under the panel header, it is open by default,
 * it holds one button per entry, and clicking the trigger collapses it.
 */
async function openPanel(editorPage: import('@playwright/test').Page): Promise<void> {
  const entry = editorPage.locator('.ai-feature-entry')
  const toggle = editorPage.locator('.ai-entry').first()
  // the panel finishes mounting after the tab appears, so judge by polling rather than
  // one snapshot: a single read taken too early would otherwise toggle an open panel shut
  await expect
    .poll(
      async () => {
        if (await entry.isVisible().catch(() => false)) return true
        if (await toggle.isVisible().catch(() => false)) await toggle.click()
        return false
      },
      { timeout: 30_000 },
    )
    .toBe(true)
  await expect(entry).toBeVisible()
}

test.describe('the AI feature bubble at the top of the panel', () => {
  test('sheets: the two analysis entries', async () => {
    test.setTimeout(180_000)
    const launched = await launchShell({ videoDir: 'ai-feature-bubble', openFile: SHEETS_BOOK })
    try {
      const editorPage = await waitForPageWithUrl(launched.app, '://sheets/')
      await openPanel(editorPage)
      const trigger = editorPage.locator('.ai-feature-trigger')
      const bubble = editorPage.locator('.ai-feature-bubble')
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      await expect(bubble.locator('.ai-feature-btn')).toHaveCount(2)
      await expect(bubble.locator('.ai-feature-btn:disabled')).toHaveCount(0)
      // the entry row is the top of the panel: nothing but the header sits above it
      await expect
        .poll(
          async () =>
            (await bubble.boundingBox())!.y <
            (await editorPage.locator('.ai-chat').boundingBox())!.y,
        )
        .toBe(true)
      await trigger.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await expect(editorPage.locator('.ai-feature-btn')).toHaveCount(0)
    } finally {
      await closeAndSaveVideo(launched, 'ai-feature-bubble-sheets')
    }
  })

  test('slides: the three deck entries', async () => {
    test.setTimeout(180_000)
    const launched = await launchShell({ videoDir: 'ai-feature-bubble', openFile: SLIDES_DECK })
    try {
      const editorPage = await waitForPageWithUrl(launched.app, '://slides/')
      await openPanel(editorPage)
      const trigger = editorPage.locator('.ai-feature-trigger')
      const bubble = editorPage.locator('.ai-feature-bubble')
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      await expect(bubble.locator('.ai-feature-btn')).toHaveCount(3)
      await expect(bubble.locator('.ai-feature-btn:disabled')).toHaveCount(0)
      await trigger.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await expect(editorPage.locator('.ai-feature-btn')).toHaveCount(0)
    } finally {
      await closeAndSaveVideo(launched, 'ai-feature-bubble-slides')
    }
  })

  test('pdf: the five document entries', async () => {
    test.setTimeout(180_000)
    const dir = await mkdtemp(join(tmpdir(), 'officecc-bubble-'))
    const pdfPath = join(dir, 'handout.pdf')
    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const page = doc.addPage([400, 300])
    page.drawText('Entries live in the panel now', { x: 40, y: 200, size: 14, font })
    await writeFile(pdfPath, await doc.save())

    const launched = await launchShell({ videoDir: 'ai-feature-bubble', openFile: pdfPath })
    try {
      const editorPage = await waitForPageWithUrl(launched.app, '://pdf/')
      await openPanel(editorPage)
      const trigger = editorPage.locator('.ai-feature-trigger')
      const bubble = editorPage.locator('.ai-feature-bubble')
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      await expect(bubble.locator('.ai-feature-btn')).toHaveCount(5)
      // a writable pdf gates nothing; the two editing entries grey out only in read-only
      await expect(bubble.locator('.ai-feature-btn:disabled')).toHaveCount(0)
      await trigger.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await expect(editorPage.locator('.ai-feature-btn')).toHaveCount(0)
    } finally {
      await closeAndSaveVideo(launched, 'ai-feature-bubble-pdf')
    }
  })
})
