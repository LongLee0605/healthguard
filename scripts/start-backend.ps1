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
. (Join-Path $PSScriptRoot "lib\common.ps1")
. (Join-Path $PSScriptRoot "lib\ui.ps1")
Set-Location (Join-Path $root "backend")

Write-HgBanner "dev:backend" "Postgres + Ollama + migrate + API :3001"
Write-HgInfo "Thu muc" (Get-Location).Path
Write-HgInfo "Swagger" "http://localhost:3001/api/docs"
Write-HgInfo "Health" "http://localhost:3001/api/health"
Write-Host ""

if (-not (Test-Path ".env")) {
  Write-HgStep 1 6 "Tao file .env tu mau"
  & (Join-Path $root "scripts\setup-envs.ps1")
} else {
  Write-HgStep 1 6 "backend/.env da co"
}

if (-not (Test-DockerRunning)) {
  Write-HgStep 2 6 "Khoi dong Docker Desktop"
  $null = Start-DockerDesktopIfNeeded -WaitSeconds 90
} else {
  Write-HgStep 2 6 "Docker dang chay"
}

if (-not (Test-DockerRunning)) {
  Write-HgErr "Docker chua san sang. Mo Docker Desktop, doi icon xanh, chay lai npm run dev:backend"
  exit 1
}

Write-HgStep 3 6 "Container Postgres + Ollama"
$prevErrorAction = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
docker compose up -d postgres ollama 2>&1 | Out-Null
$ErrorActionPreference = $prevErrorAction

Write-HgStep 4 6 "Cho PostgreSQL healthy"
if (-not (Wait-PostgresReady -BackendDir (Get-Location))) {
  Write-HgErr "PostgreSQL chua san sang. Xem: cd backend; docker compose logs postgres"
  exit 1
}
Write-HgOk "PostgreSQL san sang"

Write-HgStep 5 6 "Model Ollama (bo qua neu da co)"
try {
  & (Join-Path $root "scripts\pull-ollama-model.ps1")
} catch {
  Write-HgWarn "Ollama chua san - API van chay, AI dung mock cho den khi Ollama len"
}

Write-HgStep 6 6 "Migrate + Prisma generate"
Stop-PortListener -Port 3001
Start-Sleep -Seconds 1

npx --no prisma migrate deploy
npx --no prisma generate

Stop-PortListener -Port 3001
Start-Sleep -Seconds 1
Stop-PortListener -Port 3001

if (Test-Path "tsconfig.build.tsbuildinfo") {
  Remove-Item "tsconfig.build.tsbuildinfo" -Force
}

Write-Host ""
Write-HgOk "Mo API - log NestJS ben duoi"
Write-HgInfo "API" "http://localhost:3001/api"
Write-HgInfo "Docs" "http://localhost:3001/api/docs"
Write-Host ""
$env:AI_PROVIDER = $null
if (-not $env:UV_THREADPOOL_SIZE) { $env:UV_THREADPOOL_SIZE = "16" }
npm run dev
