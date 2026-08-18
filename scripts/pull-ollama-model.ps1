$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "lib\common.ps1")

$envFile = Load-DotEnv (Join-Path $root "backend\.env")
$model = if ($envFile['OLLAMA_MODEL']) { $envFile['OLLAMA_MODEL'] } elseif ($env:OLLAMA_MODEL) { $env:OLLAMA_MODEL } else { "qwen2.5:7b-instruct" }
$embedModel = if ($envFile['OLLAMA_EMBED_MODEL']) { $envFile['OLLAMA_EMBED_MODEL'] } elseif ($env:OLLAMA_EMBED_MODEL) { $env:OLLAMA_EMBED_MODEL } else { "nomic-embed-text" }

$useDocker = Test-DockerRunning
$useNative = (-not $useDocker) -and (Test-OllamaCli)

if (-not $useDocker -and -not $useNative) {
  if (-not (Test-DockerRunning)) {
    $null = Start-DockerDesktopIfNeeded -WaitSeconds 60
    $useDocker = Test-DockerRunning
  }
  if (-not $useDocker -and (Test-OllamaCli)) {
    $useNative = $true
  }
}

if (-not $useDocker -and -not $useNative) {
  Write-Host "Neither Docker nor Ollama CLI available."
  Write-Host "  Option A: Start Docker Desktop, then npm run dev:ollama"
  Write-Host "  Option B: Install Ollama from https://ollama.com/download"
  exit 1
}

if ($useDocker) {
  Set-Location (Join-Path $root "backend")
  Write-Host "Starting Ollama container..."
  $prevErrorAction = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  docker compose up -d ollama 2>&1 | Out-Null
  $ErrorActionPreference = $prevErrorAction
}

Write-Host "Waiting for Ollama at http://localhost:11434 ..."
$ready = $false
for ($i = 0; $i -lt 45; $i++) {
  if (Test-OllamaHttp) { $ready = $true; break }
  Start-Sleep -Seconds 2
}

if (-not $ready) {
  Write-Host "Ollama not ready after 90s."
  if ($useDocker) { Write-Host "Check: cd backend && docker compose logs ollama" }
  exit 1
}

function Test-ModelPresent {
  param([string]$ModelName)
  if ($useDocker) {
    Set-Location (Join-Path $root "backend")
    try {
      $out = docker compose exec -T ollama ollama list 2>$null
      return $out -match [regex]::Escape($ModelName.Split(':')[0])
    } catch {
      return $false
    }
  }
  try {
    $out = ollama list 2>$null
    return $out -match [regex]::Escape($ModelName.Split(':')[0])
  } catch {
    return $false
  }
}

function Pull-Model {
  param([string]$ModelName)
  if ($useDocker) {
    Set-Location (Join-Path $root "backend")
    docker compose exec -T ollama ollama pull $ModelName
  } else {
    ollama pull $ModelName
  }
  return $LASTEXITCODE
}

if (Test-ModelPresent -ModelName $model) {
  Write-Host "Chat model already present: $model"
} else {
  Write-Host "Pulling chat model: $model (internet required once, ~2GB)..."
  if ((Pull-Model -ModelName $model) -ne 0) { exit 1 }
}

if (Test-ModelPresent -ModelName $embedModel) {
  Write-Host "Embedding model already present: $embedModel"
} else {
  Write-Host "Pulling embedding model: $embedModel ..."
  if ((Pull-Model -ModelName $embedModel) -ne 0) { exit 1 }
}

Write-Host ""
Write-Host "Ollama ready."
Write-Host "  Chat model : $model"
Write-Host "  Embed model: $embedModel"
Write-Host "  API        : http://localhost:11434"
Write-Host "  Mode       : $(if ($useDocker) { 'Docker' } else { 'Native CLI' })"
