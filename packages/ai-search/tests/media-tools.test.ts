import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@office-cc/ai-provider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@office-cc/ai-provider')>()
  return {
    ...actual,
    generateImageWithProvider: vi.fn(),
    analyzeMediaWithProvider: vi.fn(),
  }
})

import { analyzeMediaWithProvider, generateImageWithProvider } from '@office-cc/ai-provider'
import { NO_MEDIA_PROVIDER_ERROR, analyzeMediaTool, generateImageTool } from '../src/media-tools'

const gen = vi.mocked(generateImageWithProvider)
const analyze = vi.mocked(analyzeMediaWithProvider)

/** nonexistent settings file → defaults: no media provider is configured */
const NO_PROVIDER_SETTINGS = '/nonexistent/ai-settings.json'

function writeSettings(mediaProvider: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'officecc-media-tools-'))
  const path = join(dir, 'ai-settings.json')
  writeFileSync(
    path,
    JSON.stringify({
      provider: 'custom',
      providers: { custom: { apiKey: 'k', model: 'm', baseUrl: 'https://example.test/v1' } },
      media: {
        provider: mediaProvider,
        providers: {
          [mediaProvider]: {
            apiKey: 'k',
            analysisModel: 'test-model',
            imageModel: 'test-image-model',
          },
        },
      },
    }),
  )
  return path
}

beforeEach(() => {
  gen.mockReset()
  analyze.mockReset()
})

describe('generateImageTool', () => {
  it('refuses to run without a configured media provider', async () => {
    const r = await generateImageTool(NO_PROVIDER_SETTINGS, { prompt: 'red podcast icon' })
    expect(r).toEqual({ error: NO_MEDIA_PROVIDER_ERROR })
    expect(gen).not.toHaveBeenCalled()
  })

  it('sends the prompt and the transparent flag to the configured provider', async () => {
    gen.mockResolvedValueOnce({ bytes: new Uint8Array([1, 2, 3]), mime: 'image/png' })
    const r = await generateImageTool(writeSettings('gemini'), {
      prompt: 'red podcast icon',
      transparentBackground: true,
    })
    expect(gen).toHaveBeenCalledTimes(1)
    expect(gen.mock.calls[0]![2]).toMatchObject({
      prompt: 'red podcast icon',
      transparent: true,
    })
    expect(r.url?.startsWith('file://')).toBe(true)
  })

  it('surfaces a provider failure as an error', async () => {
    gen.mockRejectedValueOnce(new Error('quota exceeded'))
    const r = await generateImageTool(writeSettings('gemini'), { prompt: 'red podcast icon' })
    expect(r).toEqual({ error: 'quota exceeded' })
  })

  it('rejects too many reference images with the BYOK wording', async () => {
    const referenceImageUrls = Array.from({ length: 13 }, (_, i) => `https://cdn/x/${i}.png`)
    const r = await generateImageTool(writeSettings('gemini'), {
      prompt: 'red podcast icon',
      referenceImageUrls,
    })
    expect(r).toEqual({
      error: 'Too many media items in one request (13, limit 12); analyze them in smaller batches',
    })
    expect(gen).not.toHaveBeenCalled()
  })
})

describe('analyzeMediaTool', () => {
  it('refuses to run without a configured media provider', async () => {
    const r = await analyzeMediaTool(NO_PROVIDER_SETTINGS, {
      mediaUrls: ['https://cdn/x/1.png'],
      requirements: 'describe these',
    })
    expect(r).toEqual({ error: NO_MEDIA_PROVIDER_ERROR })
    expect(analyze).not.toHaveBeenCalled()
  })

  it('rejects too many media URLs with the BYOK wording', async () => {
    const mediaUrls = Array.from({ length: 13 }, (_, i) => `https://cdn/x/${i}.png`)
    const r = await analyzeMediaTool(writeSettings('gemini'), {
      mediaUrls,
      requirements: 'describe',
    })
    expect(r).toEqual({
      error: 'Too many media items in one request (13, limit 12); analyze them in smaller batches',
    })
    expect(analyze).not.toHaveBeenCalled()
  })
})
