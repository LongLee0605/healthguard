$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "lib\ui.ps1")

Write-HgBanner "dev:all" "Mở 4 cửa sổ PowerShell (backend, frontend, desktop, mobile)"
$commands = @(
  @{ Name = "HealthGuard Backend"; Command = "Set-Location '$root'; npm run dev:backend" },
  @{ Name = "HealthGuard Frontend"; Command = "Set-Location '$root'; npm run dev:frontend" },
  @{ Name = "HealthGuard Desktop"; Command = "Set-Location '$root'; npm run dev:desktop" },
  @{ Name = "HealthGuard Mobile"; Command = "Set-Location '$root'; npm run dev:mobile" }
)

foreach ($item in $commands) {
  Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $item.Command
  ) -WindowStyle Normal
  Write-HgOk "Đã mở $($item.Name)"
}

Write-HgInfo "Web" "http://localhost:3000"
Write-HgInfo "API" "http://localhost:3001/api"
Write-Host ""

