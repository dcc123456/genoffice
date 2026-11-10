import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchShell, closeAndSaveVideo, screenshotPath } from './helpers'

test('Jev reranking lives in the AI Media & Search pane, saves with it, and reports its own test verdict', async () => {
  // the star prompt card sits over the pane footer on a small window
  const launched = await launchShell({
    settings: { starPrompt: { resolved: true } },
    videoDir: 'settings-media-search',
  })
  const { page, userDataDir } = launched
  try {
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await page.locator('.set-nav-item').filter({ hasText: 'General' }).click()
    await expect(page.getByRole('switch', { name: 'Jev search reranking' })).toHaveCount(0)

    await page.locator('.set-nav-item').filter({ hasText: 'AI Media & Search' }).click()
    const block = page.locator('section', {
      has: page.locator('.set-pane-subtitle', { hasText: 'Local file search' }),
    })
    const toggle = block.getByRole('switch', { name: 'Jev search reranking' })
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
    await toggle.click()
    await block.getByRole('button', { name: 'Jev endpoint', exact: true }).click()
    await page.getByRole('option', { name: 'Jev (TypeSafe API)', exact: true }).click()

    // the block reports its own verdict: no key entered, nothing leaves the machine
    await page.getByRole('button', { name: 'Test connection', exact: true }).click()
    await expect(block.locator('.set-ai-status.err')).toHaveText('Enter an API key')
    // the footer names the first failing block and its provider; which block
    // comes first is the completion order of the checks, and with no key
    // configured every capability block fails, so any of the five labels can lead
    await expect(page.locator('.set-pane-actions .set-ai-status.err')).toHaveText(
      /^(Web search|Image generation|Image analysis|Video analysis|Local file search) · .+: .+/,
    )
    await page.screenshot({ path: screenshotPath('settings-media-search-test') })

    await block.locator('#set-search-jev-key').fill('ts-key')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.locator('.set-pane-actions .set-ai-status.ok')).toHaveText('Saved')
    await expect
      .poll(async () => {
        const saved = JSON.parse(await readFile(join(userDataDir, 'app-settings.json'), 'utf8'))
        return saved.fileSearch
      })
      .toEqual({
        rerank: true,
        endpoint: 'direct',
        keys: {
          // one entry per decision endpoint, in ENDPOINT_IDS order: `toEqual` on
          // the saved shape is the tripwire that makes adding an endpoint a
          // deliberate act rather than a silent new key in every settings file
          openrouter: '',
          direct: 'ts-key',
          perplexity: '',
          liquid: '',
          cloudflare: '',
          kev: '',
          rizzo: '',
          custom: '',
        },
        customBaseUrl: '',
        customModel: '',
        cloudflareAccountId: '',
        cloudflareModel: '@cf/cloudflare/clef',
      })
  } finally {
    await closeAndSaveVideo(launched, 'settings-media-search')
  }
})
