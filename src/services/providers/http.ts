export async function providerFetch(targetUrl: string, init: RequestInit, useProxy: boolean): Promise<Response> {
  if (!useProxy) return fetch(targetUrl, init)
  const headers = new Headers(init.headers)
  headers.set('x-target-url', targetUrl)
  return fetch('/api/proxy', { method: init.method || 'POST', headers, body: init.body })
}

export async function responseJson(response: Response): Promise<any> {
  const text = await response.text()
  try { return JSON.parse(text) } catch { return { _raw: text.slice(0, 500) } }
}

export function providerError(json: any, status: number): string {
  return String(json?.error?.message || json?.message || json?.code || json?._raw || `请求失败 (HTTP ${status})`)
}

export function extractProviderImage(json: any): string | null {
  if (json?.data?.[0]?.b64_json) return `data:image/png;base64,${json.data[0].b64_json}`
  if (json?.data?.[0]?.url) return json.data[0].url
  if (json?.output_images?.[0]) return json.output_images[0]
  const results = json?.output?.results
  if (Array.isArray(results) && results[0]) return typeof results[0] === 'string' ? results[0] : results[0]?.url || null
  if (json?.output?.choices?.[0]?.message?.content) {
    const content = json.output.choices[0].message.content
    if (Array.isArray(content)) {
      const image = content.find((item: any) => item?.image || item?.image_url?.url)
      if (image) return image.image || image.image_url?.url
    }
  }
  return null
}

export function apiV1Root(baseUrl: string): string {
  const root = baseUrl.trim().replace(/\/+$/, '').replace(/\/v1$/i, '')
  return `${root}/v1`
}
