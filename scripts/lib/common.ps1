function Test-DockerRunning {
  try {
    docker info 2>$null | Out-Null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

function Start-DockerDesktopIfNeeded {
  param([int]$WaitSeconds = 90)

  if (Test-DockerRunning) {
    return $true
  }

  $dockerDesktop = @(
    "${env:LOCALAPPDATA}\Programs\DockerDesktop\Docker Desktop.exe",
    "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe",
    "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
    "${env:LOCALAPPDATA}\Programs\Docker\Docker\Docker Desktop.exe"
  ) | Where-Object { Test-Path $_ } | Select-Object -First 1

  if (-not $dockerDesktop) {
    Write-Host "Docker Desktop not found. Install from https://www.docker.com/products/docker-desktop/"
    return $false
  }

  Write-Host "Starting Docker Desktop (wait up to ${WaitSeconds}s)..."
  Start-Process $dockerDesktop | Out-Null

  for ($i = 0; $i -lt $WaitSeconds; $i += 3) {
    Start-Sleep -Seconds 3
    if (Test-DockerRunning) {
      Write-Host "Docker is ready."
      return $true
    }
  }

  Write-Host "Docker did not become ready in time. Open Docker Desktop manually, then retry."
  return $false
}

function Test-OllamaHttp {
  try {
    Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 3 | Out-Null
    return $true
  } catch {
    return $false
  }
}

function Test-OllamaCli {
  try {
    Get-Command ollama -ErrorAction Stop | Out-Null
    return $true
  } catch {
    return $false
  }
}

function Load-DotEnv {
  param([string]$Path)
  $map = @{}
  if (-not (Test-Path $Path)) { return $map }
  Get-Content $Path | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    if ($_ -match '^([^=]+)=(.*)$') {
      $map[$Matches[1].Trim()] = $Matches[2].Trim()
    }
  }
  return $map
}

function Wait-PostgresReady {
  param(
    [string]$BackendDir,
    [int]$MaxAttempts = 45,
    [int]$SleepSeconds = 2
  )

  for ($i = 0; $i -lt $MaxAttempts; $i++) {
    $status = docker compose ps postgres --format "{{.Status}}" 2>$null
    if ($status -match 'healthy') { return $true }
    try {
      docker compose exec -T postgres pg_isready -U healthguard 2>$null | Out-Null
      if ($LASTEXITCODE -eq 0) { return $true }
    } catch {}
    Start-Sleep -Seconds $SleepSeconds
  }
  return $false
}

function Ensure-PostgresPort {
  param([string]$BackendDir)
  Set-Location $BackendDir

  $portCheck = netstat -ano | Select-String ":5432\s" | Select-String "LISTENING"
  if (-not $portCheck) { return }

  $ourContainer = docker compose ps postgres --format "{{.Ports}}" 2>$null
  if ($ourContainer -match '5432->5432') { return }

  Write-Host "Port 5432 is in use by another process/container."
  $others = docker ps --filter "publish=5432" --format "{{.Names}} ({{.Image}})" 2>$null
  if ($others) {
    Write-Host "  Containers on 5432: $others"
    Write-Host "  Stopping conflicting container to use pgvector..."
    docker ps --filter "publish=5432" -q | ForEach-Object { docker stop $_ 2>$null | Out-Null }
    docker compose up -d postgres 2>&1 | Out-Null
    Start-Sleep -Seconds 3
  }
}
