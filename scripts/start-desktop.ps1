$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "lib\ui.ps1")
$desktopPath = Join-Path $root "desktop"

Write-HgBanner "dev:desktop" "Electron · cần web đang chạy ở :3000"

if (-not (Test-Path (Join-Path $desktopPath ".env"))) {
  Copy-Item (Join-Path $desktopPath ".env.example") (Join-Path $desktopPath ".env")
}

try {
  $frontendOk = Invoke-WebRequest -Uri "http://localhost:3000/login" -UseBasicParsing -TimeoutSec 3
} catch {
  throw "Frontend chưa chạy tại http://localhost:3000. Hãy chạy npm run dev:frontend trước."
}

subst X: $root 2>$null | Out-Null
Set-Location "X:\desktop"
$env:FRONTEND_URL = "http://localhost:3000"

Write-HgInfo "FRONTEND_URL" "http://localhost:3000"
Write-HgOk "Khởi động Electron (path ASCII X:\\desktop)"
npm run dev

