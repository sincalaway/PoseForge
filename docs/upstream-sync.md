# 上游同步规则

目标仓库 `sincalaway/PoseForge` 每天从 `anhao/ai-pose-gallery-zh` 的 `main` 分支检查更新。GitHub Actions 会自动同步上游新增和修改的文件，并在目标仓库 `main` 分支提交变更；不会重写现有 Git 历史。

同步采用按文件更新，而不是语义合并。除下方保护清单外，上游修改同一文件时会使用上游文件覆盖本仓库版本；请审阅同步提交，特别是涉及 provider、主题和工作流的源文件。

## 删除需要人工确认

上游删除不会被每日任务自动应用。工作流会把删除路径记录在 `scripts/upstream-sync-pending-deletions.json`，并在每次运行的摘要中持续列出待确认清单。

如需接受删除，请先审阅 GitHub Actions 最近一次运行摘要中的完整待确认清单，然后在 **Actions → Daily upstream sync → Run workflow** 手动运行，并勾选 `confirm_deletions`。该次运行只会处理运行开始前已在待确认清单中的路径；本次新发现的删除仍会保留，须另行审阅和确认。确认运行会先检查上游是否已恢复相应路径；已恢复的项只移出待确认清单，不删除本地文件。

保存的同步基线位于 `scripts/upstream-sync-baseline.txt`；上游历史不再包含该基线时，任务会安全停止而不会猜测或覆盖。

## 本仓库维护的文件

下列文件由 PoseForge 维护，不接受上游自动覆盖或删除；运行摘要会列出被跳过的上游变更：

- `.github/workflows/upstream-sync.yml`
- `scripts/sync_upstream.py`
- `scripts/upstream-sync-baseline.txt`
- `scripts/upstream-sync-pending-deletions.json`
- `README.md`
- `docs/upstream-sync.md`
- `docs/image-provider-adapters.md`
- `docs/poseforge-differences.md`

README 与差异/适配器文档受保护，是为了保留本仓库的品牌、扩展功能及独立部署说明；上游新增能力如影响这些文档，应人工复核补充，而不是整体替换。

## 运行时间

计划任务每天 **02:17 UTC**（北京时间 10:17）运行。也可通过 Actions 页面手动启动一次不应用删除的同步检查。

GitHub 源码同步与 Cloudflare 生产部署是两个不同步骤。只有现有独立 Worker 已完成仓库授权与 Git 构建连接后，同步提交才有相应自动部署链路；不要仅凭 GitHub 同步成功就认定页面已上线。Worker 名称、站点地址与推荐构建命令见 [README 部署说明](../README.md#部署)。
