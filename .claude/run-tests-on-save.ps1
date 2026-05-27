$json = [Console]::In.ReadToEnd() | ConvertFrom-Json
$f = $json.tool_input.file_path

if (-not $f) { exit 0 }
if (-not ($f.EndsWith('.ts') -or $f.EndsWith('.tsx'))) { exit 0 }

$root = 'E:\9. Codex\lumo-task-web'

if ($f -match 'web-app') {
    Set-Location "$root\web-app"
    npm test 2>&1 | Select-Object -Last 20
} elseif ($f -match 'backend') {
    Set-Location "$root\backend"
    npm test 2>&1 | Select-Object -Last 20
}
