import type { ImageProviderAdapter } from '../context'
import { apiV1Root, extractProviderImage, providerError, providerFetch, responseJson } from '../http'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const modelScopeAdapter: ImageProviderAdapter = {
  async generate(context) {
    if (!context.apiKey) throw new Error('请先配置 ModelScope API Key（SDK Token）')
    if (context.allImageRefs.some((image) => image.startsWith('data:'))) {
      throw new Error('ModelScope 图生图要求服务器可访问的图片 URL；当前参考图含本地上传/Base64 图片。请改用图库中的在线图片，或关闭三合一合成图后重试。')
    }

    const root = apiV1Root(context.baseUrl)
    const submit = await providerFetch(`${root}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.apiKey}`,
        'X-ModelScope-Async-Mode': 'true',
      },
      body: JSON.stringify({ model: context.model, prompt: context.prompt, image_url: context.allImageRefs }),
    }, context.config.useProxy)
    const created = await responseJson(submit)
    if (!submit.ok) throw new Error(`[ModelScope] ${providerError(created, submit.status)}`)
    const taskId = created?.task_id
    if (!taskId) throw new Error(`[ModelScope] 已提交请求但未返回 task_id：${JSON.stringify(created).slice(0, 260)}`)

    const report = context.onProgress ?? (() => {})
    report({ stage: 'queue', message: 'ModelScope 任务已提交，等待生成…' })
    const taskUrl = `${root}/tasks/${encodeURIComponent(String(taskId))}`
    const maxAttempts = 60
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await sleep(5000)
      const response = await providerFetch(taskUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${context.apiKey}`,
          'X-ModelScope-Task-Type': 'image_generation',
        },
      }, context.config.useProxy)
      const status = await responseJson(response)
      if (!response.ok) throw new Error(`[ModelScope] ${providerError(status, response.status)}`)
      const state = String(status?.task_status || '').toUpperCase()
      if (state === 'SUCCEED' || state === 'SUCCEEDED') {
        const imageUrl = extractProviderImage(status)
        if (!imageUrl) throw new Error('[ModelScope] 任务成功，但响应中没有 output_images 图片地址')
        return { imageUrl, modelUsed: context.model }
      }
      if (state === 'FAILED' || state === 'ERROR') {
        throw new Error(`[ModelScope] 生成失败：${providerError(status, response.status)}`)
      }
      report({ stage: 'running', message: `ModelScope 正在生成…（已等待 ${(attempt + 1) * 5} 秒）` })
    }
    throw new Error('[ModelScope] 生成等待超时（5 分钟），请稍后重试')
  },
}
