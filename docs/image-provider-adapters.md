# 图片生成 provider 适配器开发指南

## 当前结构

合成台统一调用 `generateCharacterImage()`。该 facade 负责校验配置、整理参考图，并生成统一的 `{ imageUrl, modelUsed, providerUsed }` 结果；具体服务由 `src/services/providers/registry.ts` 中的 `ImageProviderAdapter` 分派。adapter 收到统一的提示词、模型、Key、参考图 URL/Base64 和请求配置，返回图片 URL 或 data URL。旧 Gemini、GPT、Qwen、Doubao 仍通过兼容 adapter 执行原协议，不改变已保存的配置和请求行为；ComfyUI 的既有工作流执行也保留。

## 新增一家服务

1. 在 `src/types/gallery.ts` 的 `ImageProviderId` 中加入稳定的 provider ID，并在 `ApiConfig.providers` 默认配置中为它初始化 `baseUrl`、`apiKey`、`model` 和 `customModel`。
2. 在 `PROVIDER_META` 加名称、短名称、默认 Base URL、官方文档 URL 和模型选项。设置页与合成台的 provider 顺序数组也要添加该 ID。
3. 在 `src/services/providers/adapters/` 新建文件，实现 `ImageProviderAdapter.generate(context)`。使用 `providerFetch()` 支持同源代理；把各厂商认证、请求字段、轮询、错误解析和返回格式限制在本 adapter 中。
4. 在 `src/services/providers/registry.ts` 注册 adapter。新增 provider 不应在 React 页面中硬编码厂商请求协议。
5. 若浏览器不能直连服务，在 `functions/api/proxy.ts` 加入精确 HTTPS origin、所需请求方法与自定义头，并在 `vite.config.ts` 本地开发代理转发相同请求头；不要扩大为任意目标。
6. 更新 `mergeStoredConfig()` 为旧配置补默认 provider 节点，决定是否默认启用 CORS proxy，补充 README/配置页提示。
7. 执行 `pnpm build` 和 `pnpm lint`；可行时用 mock fetch 覆盖成功响应、错误响应、任务超时和图片解析。

## 本次新增服务的限制

- Pollinations 使用 `POST /v1/images/generations` 和 OpenAI 兼容图片响应，并用 `image` 字段传参考图；模型目录和计费规则可能变化，请以 [官方 API 文档](https://gen.pollinations.ai/docs) 为准。官方建议浏览器应用通过 BYOP OAuth 获取用户授权 Key；本项目当前是本机浏览器保存 Key 的既有模式。
- ModelScope API-Inference 使用 `POST /v1/images/generations` 提交异步任务，再通过 `GET /v1/tasks/{task_id}` 轮询。参考图必须是服务端可访问的 URL；本地上传产生的 Data URL 与拼图暂时不支持。具体模型及配额以 [ModelScope API-Inference 文档](https://www.modelscope.cn/docs/model-service/API-Inference/intro) 为准。
