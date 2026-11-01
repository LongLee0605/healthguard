$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "lib\ui.ps1")

Write-HgBanner "dev:all" "Open 3 PowerShell windows (backend, frontend, desktop)"
$commands = @(
  @{ Name = "HealthGuard Backend"; Command = "Set-Location '$root'; npm run dev:backend" },
  @{ Name = "HealthGuard Frontend"; Command = "Set-Location '$root'; npm run dev:frontend" },
  @{ Name = "HealthGuard Desktop"; Command = "Set-Location '$root'; npm run dev:desktop" }
)

foreach ($item in $commands) {
  Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $item.Command
  ) -WindowStyle Normal
  Write-HgOk "Opened $($item.Name)"
}

Write-HgInfo "Web" "http://localhost:3000"
Write-HgInfo "API" "http://localhost:3001/api"
Write-Host ""
