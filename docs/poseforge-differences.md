# PoseForge 与上游的差异

PoseForge 基于 [anhao/ai-pose-gallery-zh](https://github.com/anhao/ai-pose-gallery-zh)。本说明以已同步的上游提交 [`488939139c69acfe078372b39d4bd0c457dc060e`](https://github.com/anhao/ai-pose-gallery-zh/commit/488939139c69acfe078372b39d4bd0c457dc060e) 为基线，区分本仓库独有实现和已经包含在上游中的能力。同步基线以 `scripts/upstream-sync-baseline.txt` 为准，后续推进基线时也应复核此文档。

## 最重要的新增能力

### Qwen Image 2.1 本地多参考预设

新增 `qwen21_multiref` ComfyUI API 工作流预设，使用三个人像/服装/姿势 LoadImage 节点与 `TextEncodeQwenImage21`，默认绑定提示词节点 8，并将提示词中的“图N”转换为 `<imageN>` 引用。

这是 **本地 ComfyUI 预设**，需要用户安装工作流对应的 Qwen Image 2.1 模型与节点；与百炼 Qwen provider、Pollinations 中的 Qwen 模型选项是不同入口。仓库包含预设不代表本机依赖已安装。

涉及：`src/workflows/qwen_image_2_1_multiref.api.json`、`src/services/aiGenerator.ts`。

### Pollinations 和 ModelScope

新增两家 provider 的类型、默认配置、模型选项、设置页/合成台入口与旧配置补全，使 provider 选择包含 Gemini、GPT Image、Qwen、Doubao、Pollinations、ModelScope、ComfyUI 七项。

- **Pollinations：** 通过 `POST /v1/images/generations` 发送 OpenAI 兼容图片请求，以 `image` 字段提交参考图；要求配置 API Key，并从统一图片响应中解析 URL 或 Base64 输出。
- **ModelScope：** 通过相同的 generations 路径提交异步任务，再查询 `GET /v1/tasks/{task_id}`；每 5 秒轮询一次，最多等待 5 分钟，并向界面报告排队/生成状态与错误。
- **共同限制：** 两个 adapter 都会拒绝参考图中的 `data:` URL。本地上传/Base64 图片及三合一拼图暂不支持，需使用服务端可访问的图片 URL；模型列表、权限、配额及实际服务可用性由提供方决定。

涉及：`src/types/gallery.ts`、`src/store/studioStore.tsx`、`src/routes/settings.tsx`、`src/routes/studio.tsx`、`src/services/aiGenerator.ts`、`src/services/providers/adapters/pollinations.ts`、`src/services/providers/adapters/modelscope.ts`。

### provider 可扩展架构

`generateCharacterImage()` 继续作为统一入口，负责配置检查、整理参考图和规范化结果；通过 registry 分派到 provider adapter。新增请求上下文、公共 HTTP/错误处理和图片结果解析工具。原 Gemini、GPT、Qwen、Doubao 经 `legacy.ts` 兼容 adapter 调用原有实现，ComfyUI 执行链也保留。

这是架构拆分，不表示已经重新实现或实测了所有厂商协议。新增一家服务的步骤见 [适配器开发指南](image-provider-adapters.md)。

涉及：`src/services/providers/context.ts`、`http.ts`、`registry.ts`、`adapters/legacy.ts` 及上述生成入口。

## 界面与维护性改动

### PoseForge 品牌和虹彩玻璃主题

侧栏显示 PoseForge 名称并链接本仓库；页面使用紫色系浅/深色配色、渐变背景、玻璃顶栏、渐变标题、虹彩统计卡与图库入口、人像卡片轻量悬停效果。补充可见键盘焦点、清楚的选中菜单样式，并尊重系统减少动态效果偏好。

涉及：`src/index.css`、`src/components/common/PageHeader.tsx`、`StatCard.tsx`、`src/components/layout/AppHeader.tsx`、`AppSidebar.tsx`、`src/routes/__root.tsx`、`src/routes/index.tsx`。README 使用“PoseForge · 灵姿图鉴”；内部包名和 Worker 名仍保留 `ai-pose-gallery-zh`，避免改变既有部署目标。

### ComfyUI 绑定组件提取

将工作流校验反馈、人像/服装/姿势图片节点和提示词节点选择从大体量的合成台页面提取到 `ComfyWorkflowBindings.tsx`，并保留高级工作流参数入口。这是维护性重构，不能把它重复计为新的生成协议或任务恢复能力。

涉及：`src/components/studio/ComfyWorkflowBindings.tsx`、`src/routes/studio.tsx`。`src/lib/charadb.ts` 另外只有末尾空行清理，没有数据或功能变化。

## 代理与发布改动

### 新服务的代理支持

生产代理的默认目标白名单新增 `https://gen.pollinations.ai` 和 `https://api-inference.modelscope.cn`。代理支持 GET 与 POST，并转发 `X-ModelScope-Async-Mode`、`X-ModelScope-Task-Type` 等所需请求头；保留原有请求体大小检查与目标规则校验。本地 Vite 代理同步转发新增请求头。

默认生产目标采用 HTTPS 域名白名单；自定义 `PROXY_ALLOWED_ORIGINS` 会改变限制，尤其不要把 `*` 当成安全的默认设置。本地开发代理的 HTTP(S) 目标规则与生产白名单不是同一套控制。

涉及：`functions/api/proxy.ts`、`vite.config.ts`。`worker.ts` 继续复用现有代理，不是另写了一套 Worker 协议。

### 完整图库进入生产构建

`pnpm build` 在 TypeScript 检查与 Vite 打包之后运行 `scripts/prepare-static-assets.mjs`，将 `data/`、`img/`、`thumbs/`、封面、robots、sitemap 和 `_headers` 放入 `dist/`。脚本检查 `dist/index.html` 与必需素材是否存在，统计发布资产，并拒绝超过 Cloudflare 25 MiB 单文件上限的文件。

这修复仅运行旧 `pnpm build` 时可能缺失图库素材的问题。`scripts/build.sh` 仍可使用。当前独立 Worker 为 `ai-pose-gallery-zh`，目标地址是 <https://ai-pose-gallery-zh.sincalwow-361.workers.dev/>，不替换旧站 `ai-pose-361.workers.dev`。Git 自动发布需另在这个现有 Worker 中完成仓库授权与连接；源码提交和生产部署是两个不同状态，配置见 [README 部署部分](../README.md#部署)。

涉及：`package.json`、`scripts/prepare-static-assets.mjs`；`wrangler.jsonc` 与 `worker.ts` 的既有入口继续沿用。

## 上游同步与文档保护

每日 02:17 UTC 的 GitHub Actions 工作流仅在 `sincalaway/PoseForge` 运行，也可手动启动。它按保存基线取出上游新增/修改文件并提交到 `main`；不 squash、rebase 或强制推送现有历史，也不是逐行语义合并。**上游修改同一源文件时，会用上游版本覆盖该文件的本地实现，应审阅同步提交。**

上游删除只登记到待确认清单；人工审阅后，下一次手动运行勾选 `confirm_deletions` 才会应用。只确认运行开始前已在清单中的项，本轮新发现的删除仍保留。确认运行中若发现上游已经恢复路径，该项只移出清单、不删除本地文件；基线不再是上游祖先时任务会安全停止。路径安全校验、串行执行及运行摘要保留。

README、差异/适配器文档、同步脚本、基线、待删除清单和同步规则文档由 PoseForge 维护，不会被上游自动替换。本次补齐文档同时把这些品牌/扩展文档加入保护清单，避免下一次 README 更新抹掉本仓库差异说明。完整列表及操作见 [上游同步规则](upstream-sync.md)。

涉及：`.github/workflows/upstream-sync.yml`、`scripts/sync_upstream.py`、`scripts/upstream-sync-baseline.txt`、`scripts/upstream-sync-pending-deletions.json`、`docs/upstream-sync.md`，以及 README 与本说明。

## 已合入上游、不应重复算作独有差异的内容

原 README 顶部 PR #32–#41 摘要中的通知队列、ComfyUI WebSocket 实时任务跟踪/HTTP 兜底/刷新恢复、参考图缩放平移、单槽位重抽样、生成参考图快照及异步读取隔离等，已经属于当前上游基线。新增动漫服装和历代服饰也来自已合入的上游更新，不是本仓库独有数据。

当前索引为姿势 1,439、现实服装 1,407、CharaDB 动漫服装 440、GIA 动漫服装 1,320、历代服饰 57、人像 1,499，共 **6,162 条**；深度图与姿势共享 ID。`img/` 与 `thumbs/` 各 6,011 张，合计 **12,022 张本地图片**，另有 **1,760 张远程来源参考图**。原图与缩略图已分开说明，旧摘要中的 4,345 / 11,568 不再作为全站总数。

相对此上游基线，`data/`、`img/`、`thumbs/` 与 `LICENSE` 没有 PoseForge 独有的内容增删改。代码许可与图片/数据权利仍需区分，不能因分支改名而改变素材授权。

## 核对边界

本说明记录仓库中实际存在的实现，而不是对外部模型可用性或生成质量的保证。API 服务、模型权限、来源图片可访问性和本机 ComfyUI 依赖须按各自环境验证；文档补齐本身不会发起收费生图请求。
