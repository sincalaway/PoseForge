import type { ImageProviderAdapter } from '../context'
import { apiV1Root, extractProviderImage, providerError, providerFetch, responseJson } from '../http'

export const pollinationsAdapter: ImageProviderAdapter = {
  async generate(context) {
    if (!context.apiKey) throw new Error('请先配置 Pollinations API Key')
    if (context.allImageRefs.some((image) => image.startsWith('data:'))) {
      throw new Error('Pollinations 图生图需要可公开访问的图片 URL；当前参考图含本地上传/Base64 图片。请改用图库中的在线图片，或关闭三合一合成图后重试。')
    }
    const endpoint = `${apiV1Root(context.baseUrl)}/images/generations`
    const response = await providerFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${context.apiKey}` },
      body: JSON.stringify({
        model: context.model,
        prompt: context.prompt,
        image: context.allImageRefs,
        size: '1024x1536',
        n: 1,
        response_format: 'b64_json',
      }),
    }, context.config.useProxy)
    const json = await responseJson(response)
    if (!response.ok) throw new Error(`[Pollinations] ${providerError(json, response.status)}`)
    const imageUrl = extractProviderImage(json)
    if (!imageUrl) throw new Error(`[Pollinations] 接口已响应但未解析到图片输出：${JSON.stringify(json).slice(0, 260)}`)
    return { imageUrl, modelUsed: context.model }
  },
}
