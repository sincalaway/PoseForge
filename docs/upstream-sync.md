# 上游同步规则

目标仓库 `sincalaway/PoseForge` 每天从 `anhao/ai-pose-gallery-zh` 的 `main` 分支检查更新。GitHub Actions 会自动同步上游新增和修改的文件，并在目标仓库 `main` 分支提交变更。

## 删除需要人工确认

上游删除不会被每日任务自动应用。工作流会把删除路径记录在 `scripts/upstream-sync-pending-deletions.json`，并在每次运行的摘要中持续列出待确认清单。

如需接受删除，请先审阅 GitHub Actions 最近一次运行摘要中的完整待确认清单，然后在 **Actions → Daily upstream sync → Run workflow** 手动运行，并勾选 `confirm_deletions`。该次运行只会处理运行开始前已在待确认清单中的路径；本次新发现的删除仍会保留，须另行审阅和确认。上游已重新提供的路径会自动从待确认清单移除。

工作流脚本、基线、待确认清单和本文档由目标仓库维护，不会被上游覆盖。保存的同步基线位于 `scripts/upstream-sync-baseline.txt`；上游历史不再包含该基线时，任务会安全停止而不会猜测或覆盖。

## 运行时间

计划任务每天 02:17 UTC 运行。也可通过 Actions 页面手动启动一次不应用删除的同步检查。
