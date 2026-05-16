# .claude/auto-commit.ps1
# Stop hook — runs after every Claude Code session.
# Stages web-app/ changes, commits, pushes, and creates/enables auto-merge on PR.
# Merge only happens after the CI gate ("CI" status check) passes on GitHub.

Set-Location "E:\9. Codex\lumo-task-web"

# ── 1. Check for changes ──────────────────────────────────────────────────
$changes = git status --porcelain web-app/ 2>&1
if (-not $changes) {
    exit 0   # Nothing to do
}

# ── 2. Stage & commit ─────────────────────────────────────────────────────
git add web-app/

# Build a one-line summary from the staged diff
$files   = git diff --cached --name-only | ForEach-Object { Split-Path $_ -Leaf }
$summary = ($files | Select-Object -First 5) -join ", "
if ($files.Count -gt 5) { $summary += "..." }

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$msg = "feat: update web-app — $summary [$timestamp]"

git commit -m $msg
if ($LASTEXITCODE -ne 0) { exit 1 }

# ── 3. Push ───────────────────────────────────────────────────────────────
$branch = git branch --show-current
git push -u origin $branch 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Output "Push failed — check credentials or branch protection."
    exit 1
}

# ── 4. Create PR or enable auto-merge on existing PR ─────────────────────
$prJson = gh pr view --json number,url,autoMergeRequest 2>&1
if ($LASTEXITCODE -eq 0) {
    $pr = $prJson | ConvertFrom-Json
    # Enable auto-merge if not already set (squash strategy)
    if (-not $pr.autoMergeRequest) {
        gh pr merge $pr.number --auto --squash 2>&1 | Out-Null
        Write-Output "Pushed to PR #$($pr.number) — auto-merge armed (pending CI). $($pr.url)"
    } else {
        Write-Output "Pushed to PR #$($pr.number) — auto-merge already armed. $($pr.url)"
    }
} else {
    # No open PR yet — create one and immediately arm auto-merge
    $prUrl = gh pr create `
        --title "feat: lumo-task web-app updates" `
        --body "## Summary`nAutomated changes from Claude Code sessions.`n`n## CI Gate`nThis PR will auto-merge via squash once the **CI** status check passes.`n`nLatest: $msg" `
        --base main 2>&1

    $prNum = gh pr view --json number --jq .number 2>&1
    if ($prNum) {
        gh pr merge $prNum --auto --squash 2>&1 | Out-Null
        Write-Output "Created PR #$prNum with auto-merge armed (pending CI). $prUrl"
    } else {
        Write-Output "Created PR: $prUrl"
    }
}
