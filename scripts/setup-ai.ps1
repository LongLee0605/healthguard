$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "lib\common.ps1")
. (Join-Path $PSScriptRoot "lib\ui.ps1")

Write-HgBanner "setup:ai" "Env + Postgres + seed demo + model Ollama (lần đầu)"

& (Join-Path $root "scripts\setup-envs.ps1")

if (-not (Test-DockerRunning)) {
  $started = Start-DockerDesktopIfNeeded -WaitSeconds 120
  if (-not $started) {
    Write-Host ""
    Write-Host "Cannot continue without Docker (PostgreSQL + Ollama run in containers)."
    Write-Host "Alternative: install Ollama for Windows from https://ollama.com/download"
    Write-Host "  Backend DB still needs Docker for PostgreSQL."
    Write-Host ""
    Write-Host "After Docker is running: npm run setup:ai"
    exit 1
  }
}

Set-Location (Join-Path $root "backend")

Write-Host ""
Write-Host "Starting PostgreSQL (pgvector)..."
$prevErrorAction = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
docker compose up -d postgres 2>&1 | Out-Null
$ErrorActionPreference = $prevErrorAction

Ensure-PostgresPort -BackendDir (Get-Location)

Write-Host "Waiting for PostgreSQL..."
if (-not (Wait-PostgresReady -BackendDir (Get-Location))) {
  Write-Host "PostgreSQL not ready. Check: docker compose logs postgres"
  exit 1
}
Write-Host "PostgreSQL ready."

Write-Host "Running database migrations + seed..."
npm run db:setup
if ($LASTEXITCODE -ne 0) {
  Write-Host "Database setup failed."
  exit 1
}

Write-Host ""
& (Join-Path $root "scripts\pull-ollama-model.ps1")
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Ollama model pull failed. Backend still works with mock AI fallback."
  Write-Host "Retry later: npm run dev:ollama"
}

Write-Host ""
Write-HgOk "Setup AI xong"
Write-HgNext @(
  'npm run doctor          (kiểm tra - Backend/Frontend DOWN là đúng)',
  'npm run dev:backend     (terminal 1)',
  'npm run dev:frontend    (terminal 2)',
  'Đăng nhập demo@healthguard.vn / Demo@123'
)
