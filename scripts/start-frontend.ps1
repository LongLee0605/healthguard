function Stop-PortListener {
  param([int]$Port)

  $lines = netstat -ano | Select-String ":$Port\s"
  foreach ($line in $lines) {
    if ($line -match '\s+LISTENING\s+(\d+)\s*$') {
      $processId = [int]$Matches[1]
      if ($processId -gt 0) {
        try {
          Stop-Process -Id $processId -Force -ErrorAction Stop
          Write-Host "Stopped process $processId on port $Port"
        } catch {
          Write-Host "Could not stop process $processId on port $Port"
        }
      }
    }
  }
}

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "lib\ui.ps1")
Set-Location (Join-Path $root "frontend")

Write-HgBanner "dev:frontend" "Next.js - http://localhost:3000"

if (-not (Test-Path ".env.local")) {
  Write-HgStep 1 2 "Tao frontend/.env.local"
  Copy-Item ".env.example" ".env.local"
} else {
  Write-HgStep 1 2 "frontend/.env.local da co"
}

Stop-PortListener -Port 3000

Write-HgStep 2 2 "Don cache .next (tranh MIME / hydration cu)"
if (Test-Path ".next") {
  Remove-Item -Recurse -Force ".next"
  Write-HgOk "Da xoa .next"
} else {
  Write-HgOk "Khong co cache cu"
}

Write-Host ""
Write-HgInfo "Web" "http://localhost:3000"
Write-HgInfo "Login" "http://localhost:3000/login"
Write-Host ""
npm run dev
