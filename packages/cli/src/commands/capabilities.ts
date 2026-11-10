import {
  activeMediaProvider,
  activeSearchProvider,
  imageGenerationAvailable,
  mediaAnalysisAvailable,
} from '@office-cc/ai-provider'
import { readAiSettingsFile } from '@office-cc/ai-search'
import { aiSettingsPath, prepareCloud } from '../cloud'
import type { CommandDef } from '../registry'
import { appLaunch } from '../resources'

/**
 * What the cloud commands can do on this machine, decided from Office-cc's
 * own settings without a network call: a BYOK key, or the keyless Parallel
 * search. Unkeyed fallbacks in the default chain (free Parallel MCP,
 * DuckDuckGo) do not count as configured. Agents check this once before
 * planning work that needs photos or web facts.
 */
export const capabilitiesCommand: CommandDef = {
  name: 'capabilities',
  summary:
    'Report which cloud features (search, image search, image generation, media analysis) are configured in Office-cc, and whether the app is installed.',
  usage: 'capabilities',
  async run(_args, ctx) {
    await prepareCloud(ctx.env)
    const settings = readAiSettingsFile(aiSettingsPath(ctx.env))
    const searchProvider = activeSearchProvider(settings)
    const keyedImageSearch = searchProvider === 'serper' || searchProvider === 'serply'
    const imageGeneration = imageGenerationAvailable(settings)
    const mediaAnalysis = mediaAnalysisAvailable(settings)
    const detail = {
      search: {
        available: true,
        via: searchProvider,
      },
      image_search: {
        available: keyedImageSearch,
        via: keyedImageSearch ? searchProvider : null,
      },
      image_generation: {
        available: imageGeneration,
        via: imageGeneration ? activeMediaProvider(settings, 'image') : null,
      },
      media_analysis: {
        available: mediaAnalysis,
        via: mediaAnalysis ? activeMediaProvider(settings, 'analysis') : null,
      },
      app: { available: appLaunch(ctx.env) !== null },
      settings_path: aiSettingsPath(ctx.env),
    }
    const on = Object.entries(detail)
      .filter(([k, v]) => k !== 'settings_path' && (v as { available: boolean }).available)
      .map(([k]) => k)
    return {
      summary: on.length
        ? `configured: ${on.join(', ')}`
        : 'no cloud feature configured; the app is not installed',
      detail,
    }
  },
}
