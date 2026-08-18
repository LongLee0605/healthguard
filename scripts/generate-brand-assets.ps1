$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$script = Join-Path $PSScriptRoot 'generate-brand-assets.mjs'
node $script
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
