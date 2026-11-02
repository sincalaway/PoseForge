import type { ImageProviderId } from '@/types/gallery'
import type { ImageProviderAdapter } from './context'
import { comfyUiAdapter, doubaoAdapter, geminiAdapter, gptAdapter, qwenAdapter } from './adapters/legacy'
import { modelScopeAdapter } from './adapters/modelscope'
import { pollinationsAdapter } from './adapters/pollinations'

/** Shared dispatch registry. Add a provider-specific adapter here when introducing a new service. */
export const IMAGE_PROVIDER_ADAPTERS: Record<ImageProviderId, ImageProviderAdapter> = {
  gemini: geminiAdapter,
  gpt: gptAdapter,
  qwen: qwenAdapter,
  doubao: doubaoAdapter,
  pollinations: pollinationsAdapter,
  modelscope: modelScopeAdapter,
  comfyui: comfyUiAdapter,
}
