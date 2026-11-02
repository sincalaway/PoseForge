import type { ApiConfig, ImageProviderId, RecipeState } from '@/types/gallery'

export interface ProviderGenerationResult {
  imageUrl: string
  modelUsed: string
}

export interface ProviderGenerationContext {
  provider: ImageProviderId
  config: ApiConfig
  recipe: RecipeState
  prompt: string
  model: string
  baseUrl: string
  apiKey: string
  imageRefs: string[]
  allImageRefs: string[]
  onProgress?: (progress: { stage: 'check' | 'upload' | 'queue' | 'running' | 'download'; message: string; percent?: number }) => void
  /** Compatibility bridge for the pre-adapter Gemini/GPT/Qwen/Doubao protocol code. */
  runLegacyProtocol: () => Promise<ProviderGenerationResult>
  /** ComfyUI's stateful workflow runner stays in aiGenerator but follows the same contract. */
  runComfyUi: () => Promise<ProviderGenerationResult>
}

export interface ImageProviderAdapter {
  generate(context: ProviderGenerationContext): Promise<ProviderGenerationResult>
}
