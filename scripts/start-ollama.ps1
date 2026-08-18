$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "lib\ui.ps1")
Set-Location (Join-Path $root "backend")

Write-HgBanner "dev:ollama" "Container Ollama + pull model nếu thiếu"
$prevErrorAction = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
docker compose up -d ollama 2>&1 | Out-Null
$ErrorActionPreference = $prevErrorAction

& (Join-Path $root "scripts\pull-ollama-model.ps1")
