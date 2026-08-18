$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot 'lib\ui.ps1')

Write-HgBanner 'train:ai' 'Tạo model y tế local healthguard-med + đánh giá triage'

$tagsOk = $false
try {
  $null = Invoke-WebRequest -Uri 'http://localhost:11434/api/tags' -UseBasicParsing -TimeoutSec 4
  $tagsOk = $true
} catch {}

if (-not $tagsOk) {
  Write-HgWarn 'Ollama chưa lên - chạy npm run dev:ollama'
  & (Join-Path $PSScriptRoot 'pull-ollama-model.ps1')
}

node (Join-Path $root 'ml\train-ai.mjs')
exit $LASTEXITCODE
