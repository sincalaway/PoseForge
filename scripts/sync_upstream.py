#!/usr/bin/env python3
"""Apply upstream additions and updates without automatically applying deletions."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
BASELINE_FILE = ROOT / "scripts" / "upstream-sync-baseline.txt"
PENDING_FILE = ROOT / "scripts" / "upstream-sync-pending-deletions.json"
SYNC_OWNED_PATHS = {
    ".github/workflows/upstream-sync.yml",
    "scripts/sync_upstream.py",
    "scripts/upstream-sync-baseline.txt",
    "scripts/upstream-sync-pending-deletions.json",
    "docs/upstream-sync.md",
}


def git(*args: str, check: bool = True) -> subprocess.CompletedProcess[bytes]:
    result = subprocess.run(
        ["git", *args], cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    if check and result.returncode:
        message = result.stderr.decode(errors="replace").strip()
        raise RuntimeError(message or f"git {' '.join(args)} failed")
    return result


def validate_repo_path(path: str) -> None:
    parsed = PurePosixPath(path)
    if parsed.is_absolute() or ".." in parsed.parts or not path:
        raise RuntimeError(f"Unsafe repository path from upstream: {path!r}")


def load_pending() -> dict[str, str]:
    if not PENDING_FILE.exists():
        return {}
    data = json.loads(PENDING_FILE.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or any(
        not isinstance(path, str) or not isinstance(commit, str)
        for path, commit in data.items()
    ):
        raise RuntimeError(f"Invalid pending deletion manifest: {PENDING_FILE}")
    for path in data:
        validate_repo_path(path)
    return data


def append_summary(markdown: str) -> None:
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as summary:
            summary.write(markdown)


def quoted_paths(paths: list[str], limit: int = 100) -> str:
    lines = [f"- {json.dumps(path, ensure_ascii=False)}" for path in paths[:limit]]
    if len(paths) > limit:
        lines.append(
            f"- …另有 {len(paths) - limit} 项，请查看 `{PENDING_FILE.relative_to(ROOT)}`。"
        )
    return "\n".join(lines) if lines else "- 无"


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python3 scripts/sync_upstream.py <upstream-ref>", file=sys.stderr)
        return 2

    upstream_ref = sys.argv[1]
    baseline = BASELINE_FILE.read_text(encoding="utf-8").strip()
    if not baseline or any(ch not in "0123456789abcdefABCDEF" for ch in baseline):
        raise RuntimeError(f"Invalid upstream baseline in {BASELINE_FILE}")
    git("cat-file", "-e", f"{baseline}^{{commit}}")
    upstream_sha = git("rev-parse", f"{upstream_ref}^{{commit}}").stdout.decode().strip()
    if git("merge-base", "--is-ancestor", baseline, upstream_sha, check=False).returncode:
        raise RuntimeError(
            "The saved upstream baseline is not an ancestor of the fetched upstream. "
            "No files were changed; review the upstream history before resetting the baseline."
        )

    diff = git(
        "diff", "--no-renames", "--name-status", "-z", baseline, upstream_sha
    ).stdout
    fields = diff.split(b"\0")
    if fields and fields[-1] == b"":
        fields.pop()
    if len(fields) % 2:
        raise RuntimeError("Could not parse upstream change list")

    additions_updates: list[tuple[str, str]] = []
    upstream_deletions: list[str] = []
    protected_changes: list[str] = []
    for index in range(0, len(fields), 2):
        status = fields[index].decode("ascii")
        path = os.fsdecode(fields[index + 1])
        validate_repo_path(path)
        if path in SYNC_OWNED_PATHS:
            protected_changes.append(path)
        elif status == "D":
            upstream_deletions.append(path)
        elif status in {"A", "M", "T"}:
            additions_updates.append((status, path))
        else:
            raise RuntimeError(f"Unexpected upstream change status {status!r} for {path!r}")

    upstream_paths = {
        os.fsdecode(record)
        for record in git("ls-tree", "-r", "--name-only", "-z", upstream_sha).stdout.split(b"\0")
        if record
    }
    pending = load_pending()
    pending_at_start = set(pending)
    confirmed = os.environ.get("CONFIRM_UPSTREAM_DELETIONS", "false").strip().lower() == "true"
    applied_deletions: list[str] = []
    already_absent: list[str] = []
    reappeared: list[str] = []
    resolved: set[str] = set()

    # Only items already listed in the previous run's manifest can be confirmed.
    # Deletions first discovered during this run always remain pending.
    if confirmed:
        for path in sorted(pending_at_start):
            if path in upstream_paths:
                pending.pop(path, None)
                reappeared.append(path)
                resolved.add(path)
                continue
            local_path = ROOT / path
            if local_path.is_dir() and not local_path.is_symlink():
                raise RuntimeError(
                    f"Refusing to remove directory while confirming file deletion: {path}"
                )
            if local_path.exists() or local_path.is_symlink():
                local_path.unlink()
                applied_deletions.append(path)
            else:
                already_absent.append(path)
            git("add", "-u", "--", path)
            pending.pop(path, None)
            resolved.add(path)
            parent = local_path.parent
            while parent != ROOT:
                try:
                    parent.rmdir()
                except OSError:
                    break
                parent = parent.parent

    applied: list[tuple[str, str]] = []
    for status, path in additions_updates:
        git("restore", "--source", upstream_sha, "--worktree", "--", path)
        git("add", "--force", "--", path)
        applied.append((status, path))

    for path in upstream_deletions:
        if path not in resolved:
            pending.setdefault(path, upstream_sha)

    BASELINE_FILE.write_text(f"{upstream_sha}\n", encoding="utf-8")
    PENDING_FILE.write_text(
        json.dumps(pending, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    git("add", "--", str(BASELINE_FILE.relative_to(ROOT)), str(PENDING_FILE.relative_to(ROOT)))

    additions = sum(status == "A" for status, _ in applied)
    updates = sum(status in {"M", "T"} for status, _ in applied)
    pending_paths = sorted(pending)
    print(
        f"Upstream {upstream_sha}: applied {additions} additions and {updates} updates; "
        f"confirmed {len(applied_deletions)} deletions; {len(pending_paths)} pending deletions."
    )

    summary = [
        "## 每日上游同步",
        f"- 上游提交：`{upstream_sha}`",
        f"- 已同步：新增 {additions} 项、更新 {updates} 项。",
        f"- 本次人工确认并删除：{len(applied_deletions)} 项。",
    ]
    if applied_deletions:
        summary.extend(["### 已确认删除", quoted_paths(applied_deletions)])
    if already_absent:
        summary.extend(["### 已确认但目标中已不存在", quoted_paths(already_absent)])
    if reappeared:
        summary.extend(["### 上游已恢复，已从待确认清单移除", quoted_paths(reappeared)])
    if upstream_deletions:
        summary.extend(
            [
                "### 本次发现的上游删除（未执行）",
                "这些新项目不会在本次运行中被确认，即使本次是手动触发。",
                quoted_paths(sorted(upstream_deletions)),
            ]
        )
    summary.extend(
        [
            "### 当前待确认删除清单",
            "默认不会删除。先审阅下方清单；确认后手动运行工作流并勾选 `confirm_deletions`。",
            quoted_paths(pending_paths),
        ]
    )
    if protected_changes:
        summary.extend(
            [
                "### 未同步的同步配置文件",
                "这些文件由目标仓库维护，避免上游覆盖同步规则。",
                quoted_paths(sorted(protected_changes)),
            ]
        )
    append_summary("\n\n".join(summary) + "\n")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, RuntimeError, ValueError, json.JSONDecodeError) as error:
        print(f"Upstream sync stopped safely: {error}", file=sys.stderr)
        raise SystemExit(1)
