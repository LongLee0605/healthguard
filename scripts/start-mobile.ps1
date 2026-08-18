$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "lib\ui.ps1")
Set-Location (Join-Path $root "mobile")

Write-HgBanner "dev:mobile" "Expo · cần API :3001"

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
}

Write-HgOk "Expo Dev Tools - quét QR bằng Expo Go"
npm start

