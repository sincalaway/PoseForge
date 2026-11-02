import type { ImageProviderId } from '@/types/gallery'
import type { ImageProviderAdapter } from '../context'

// These adapters intentionally delegate to the existing protocol implementation so adding the
// common contract does not alter the established Gemini, GPT, Qwen, or Doubao request semantics.
type LegacyProviderId = Extract<ImageProviderId, 'gemini' | 'gpt' | 'qwen' | 'doubao'>

const bridge = (provider: LegacyProviderId): ImageProviderAdapter => ({
  generate: (context) => {
    if (context.provider !== provider) throw new Error(`Provider adapter mismatch: expected ${provider}, got ${context.provider}`)
    return context.runLegacyProtocol()
  },
})

export const geminiAdapter = bridge('gemini')
export const gptAdapter = bridge('gpt')
export const qwenAdapter = bridge('qwen')
export const doubaoAdapter = bridge('doubao')

export const comfyUiAdapter: ImageProviderAdapter = {
  generate: (context) => context.runComfyUi(),
}
