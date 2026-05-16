# .claude/auto-commit.ps1
# Runs after each Claude Code session (Stop hook).
# Stages any changes under web-app/, commits, pushes, and creates/updates a PR.

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

# ── 4. Create PR (or report existing) ────────────────────────────────────
$prJson = gh pr view --json number,url 2>&1
if ($LASTEXITCODE -eq 0) {
    $pr = $prJson | ConvertFrom-Json
    Write-Output "Committed & pushed. PR #$($pr.number): $($pr.url)"
} else {
    # No open PR yet — create one
    $prUrl = gh pr create `
        --title "feat: lumo-task web-app updates" `
        --body "Automated changes from Claude Code sessions.`n`nLatest commit: $msg" `
        --base main 2>&1
    Write-Output "Committed, pushed, and created PR: $prUrl"
}
