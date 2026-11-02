# 灵姿图鉴

姿势库（1,439 张素体白模 + 1,439 张深度图）、服装库与人像库，共 **4,345 条参考数据、11,568 张本地图片**；并提供 AI 角色合成台和 ComfyUI 自定义节点插件。

![画廊总览预览](docs/preview.jpg)

![AI 角色合成台预览](docs/studio.jpg)

<details>
<summary>手机端预览</summary>

![手机端预览](docs/mobile.jpg)

</details>

**在线演示：** <https://ai-pose-gallery.anhao.app/>

**图库原站：** [姿势库（素体白模）](https://ai-pose-gallery.pages.dev/) · [姿势深度图库（Depth）](https://ai-pose-depth-gallery.pages.dev/) · [服装库](https://ai-costume-gallery.pages.dev/) · [人像库](https://ai-portrait-gallery.pages.dev/)

**原作者：** ギア（@giaaibusi）　**中文版维护：** Anhao · [X @anhao_ai](https://x.com/anhao_ai)

> **使用提示：** 图库含有部分 18+ 成人向素体姿势与性感穿搭参考。应用默认开启安全模式以隐藏相关分类；未成年人不得关闭安全模式或访问成人内容。请遵守当地法律、尊重肖像权与隐私权，并确认你有权使用上传的图片。
>
> **来源与授权：** 图片和原始数据来自原作者公开图库，具体授权以各原站点的声明为准。本仓库的代码许可不自动扩展到图片、缩略图和原始数据；请勿擅自再分发或用于未经授权的商业用途。

## 项目包含什么

- **姿势库：** 中文检索与分类、按组或单张浏览、多角度切换、高清预览和下载；可在素体白模与深度图之间切换。
- **服装库：** 按季节、款式和标签筛选，并查看中文描述与英文提示词。
- **人像库：** 按分区、发长、发型、精选题集和热门榜单筛选。
- **AI 合成台：** 将人像、服装、姿势和自定义附加参考图组合成配方；支持参考拼图、结构化提示词、图片生成记录及本地历史，姿势槽位支持素体白模/深度图切换。
- **图像生成接口：** Google Gemini、OpenAI GPT Image、阿里云百炼 Qwen、字节火山方舟 Doubao，以及本地 ComfyUI。可用模型与参数以应用内配置为准。
- **ComfyUI 插件：** 在画布中通过姿势、服装、人像和三合一配方节点浏览图库、输出参考图与提示词；姿势和配方节点支持切换深度图，可用于 ControlNet Depth 工作流。

## 数据规模

| 图库 | 条目 | 本地图片 |
| --- | ---: | ---: |
| 姿势（素体白模） | 1,439 | 2,878（缩略图与原图） |
| 姿势深度图（与姿势 ID 对应） | 1,439 | 2,878（缩略图与原图） |
| 服装 | 1,407 | 2,814（缩略图与原图） |
| 人像 | 1,499 | 2,998（缩略图与原图） |
| **合计** | **4,345** | **11,568** |

## ComfyUI 使用方式

### 在 ComfyUI 画布中使用图库节点

将整个仓库克隆到 ComfyUI 的 `custom_nodes` 目录。插件会从仓库根目录读取图片和数据，因此不要只复制 `comfyui_plugin/` 子目录。

```bash
cd /path/to/ComfyUI/custom_nodes
git clone --depth 1 https://github.com/sincalaway/PoseForge.git PoseForge
```

重启 ComfyUI 后，在画布空白处右键打开 **「AI角色三合一参考图集」** 节点分类。插件提供姿势、服装、人像和三合一配方节点；姿势与配方节点可切换素体白模或深度图，配方节点可组合参考图并输出图片张量与提示词。

### 从网页合成台调用本机 ComfyUI

- **本地开发与预览：** Vite 已配置 `/comfy` 同源代理，默认转发到 ComfyUI Desktop 的 `http://127.0.0.1:8000`，通常不需要额外开放 CORS。若服务地址不同，可设置 `COMFYUI_URL` 后启动开发或预览服务器，例如：

  ```bash
  COMFYUI_URL=http://127.0.0.1:8188 pnpm dev
  ```

- **线上网页：** 浏览器会直接访问你配置的 ComfyUI 地址。请按 ComfyUI 的部署方式开放服务，并仅将实际网页来源加入 CORS 允许列表；不要为了方便使用通配来源公开服务。

在应用的「接口配置」中选择 **本地 ComfyUI** 后，可检测连接、导入 ComfyUI 导出的 API 工作流 JSON、绑定图片/提示词节点，并设置高级参数。模型与本地运行说明见 [ComfyUI 本地指南](docs/comfyui-local.md)；高级工作流参数说明见 [工作流参数指南](docs/comfyui-workflow-parameters.md)。

## 本地开发

需要 **Node.js `^20.19.0` 或 `>=22.12.0`**（Vite 8 要求）和 pnpm。仓库包含大量图片素材，克隆和构建会占用较多磁盘空间。

```bash
pnpm install --frozen-lockfile
pnpm dev                 # 本地开发服务器：http://localhost:5173
pnpm build               # TypeScript 检查并构建生产版本
pnpm lint                # Oxlint 代码检查
pnpm preview             # 本地预览已构建的网站
```

本地数据维护脚本使用 Python 3：

```bash
python3 scripts/download.py          # 下载或补全图库图片
DATASET=depth python3 scripts/download.py
python3 scripts/apply_translation.py # 根据词典生成中文数据
python3 scripts/verify.py            # 检查图片完整性
```

## 部署

构建脚本会运行前端生产构建，并把静态数据、图片、`_headers` 和站点元文件复制到 `dist/`：

```bash
bash scripts/build.sh
```

- **Cloudflare Workers：** 仓库通过 `worker.ts` 和 `wrangler.jsonc` 提供 Workers 入口及静态资源。可先运行 `npx wrangler dev` 本地验证，再用 `npx wrangler deploy` 部署。
- **Cloudflare Pages：** 连接 Git 仓库时，将构建命令设为 `bash scripts/build.sh`、输出目录设为 `dist`。`functions/api/proxy.ts` 提供 Pages Functions 的 `/api/proxy` 代理入口。

## 上游同步

仓库每天自动同步上游新增和修改；上游删除会保留并等待人工确认。具体规则与确认步骤见[上游同步说明](docs/upstream-sync.md)。

## 主要目录

```text
.
├── comfyui_plugin/       # ComfyUI 节点、路由和画布端扩展
├── data/                 # 三大图库的原始与中文数据
├── docs/                 # ComfyUI 指南与项目预览图
├── functions/api/        # Cloudflare Pages Functions API 代理
├── img/                  # 高清原图（含 depth/）
├── thumbs/               # 缩略图（含 depth/）
├── scripts/              # 图片、翻译、校验与构建脚本
├── skills/               # 面向 Agent 的图库检索技能
├── src/                  # 前端页面、组件、服务和状态管理
├── worker.ts             # Cloudflare Workers 入口
├── wrangler.jsonc        # Workers 配置
└── README.md
```

**主要技术栈：** React 19、TypeScript 7、Vite 8、TanStack Router/Query、Tailwind CSS 4、Radix UI。ComfyUI 插件使用 Python 与 ComfyUI 自带运行环境。

## Agent 技能

`skills/` 目录包含姿势、服装和人像图库检索技能。技能目录中的图片索引使用相对路径引用仓库素材；安装时请保留仓库目录结构。各技能的具体说明与使用方式见对应的 `SKILL.md`。

## 许可与责任

代码许可见 [LICENSE](LICENSE)。图库图片、缩略图及数据的权利和授权条件以各原站点声明为准，不因代码许可而改变。使用者需自行确认素材、生成结果及相关操作符合适用法律，并对上传内容和生成内容负责。
