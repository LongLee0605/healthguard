$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
$cli = Join-Path $PSScriptRoot 'cli.mjs'
$argList = @($cli, 'doctor') + $args
& node @argList
exit $LASTEXITCODE
