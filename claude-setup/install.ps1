# Installs the design skills globally (all projects) + Playwright MCP + test dependencies.
# Run from the project folder:
#   powershell -ExecutionPolicy Bypass -File claude-setup\install.ps1
$ErrorActionPreference = 'Stop'
$here    = $PSScriptRoot
$project = Split-Path $here -Parent

# 1. Skills -> %USERPROFILE%\.claude\skills (available in every project)
$dst = Join-Path $env:USERPROFILE '.claude\skills'
New-Item -ItemType Directory -Force -Path $dst | Out-Null
$tmp = Join-Path $env:TEMP 'claude-skills-setup'
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
Expand-Archive (Join-Path $here 'skills.zip') -DestinationPath $tmp
Get-ChildItem $tmp -Directory | ForEach-Object {
  $target = Join-Path $dst $_.Name
  if (Test-Path $target) { Remove-Item $target -Recurse -Force }
  Copy-Item $_.FullName $target -Recurse
  Write-Host "[ok] skill installed: $($_.Name)"
}

# 2. Playwright MCP
Copy-Item (Join-Path $here 'mcp.json') (Join-Path $project '.mcp.json') -Force
Write-Host "[ok] .mcp.json added to project"
if (Get-Command claude -ErrorAction SilentlyContinue) {
  $ErrorActionPreference = 'Continue'
  & cmd /c "claude mcp remove playwright --scope user >nul 2>&1"
  & claude mcp add playwright --scope user -- npx -y '@playwright/mcp@latest'
  Write-Host "[ok] Playwright MCP registered for all projects"
  $ErrorActionPreference = 'Stop'
} else {
  Write-Host "[!] 'claude' CLI not found in PATH - MCP is set for this project only (.mcp.json)"
}

# 3. Test dependencies
Push-Location $project
npm install
npx playwright install chromium
Pop-Location
Write-Host ""
Write-Host "Done. Restart Claude Code, then run:  npm test"
