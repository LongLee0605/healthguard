$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "lib\ui.ps1")

function Sync-EnvFile {
  param(
    [string]$ExamplePath,
    [string]$DestPath,
    [string[]]$RemovePrefixes = @()
  )

  if (-not (Test-Path $ExamplePath)) {
    Write-Host "Skip (no example): $DestPath"
    return
  }

  $exampleLines = Get-Content $ExamplePath
  $exampleMap = @{}
  foreach ($line in $exampleLines) {
    if ($line -match '^\s*#' -or $line -match '^\s*$') { continue }
    if ($line -match '^([^=]+)=(.*)$') {
      $exampleMap[$Matches[1].Trim()] = $Matches[2]
    }
  }

  if (-not (Test-Path $DestPath)) {
    Copy-Item $ExamplePath $DestPath
    Write-Host "Created $DestPath"
    return
  }

  $destLines = Get-Content $DestPath
  $destMap = @{}
  $order = @()
  foreach ($line in $destLines) {
    if ($line -match '^\s*#' -or $line -match '^\s*$') { continue }
    if ($line -match '^([^=]+)=(.*)$') {
      $key = $Matches[1].Trim()
      $destMap[$key] = $Matches[2]
      if ($order -notcontains $key) { $order += $key }
    }
  }

  $changed = $false

  foreach ($prefix in $RemovePrefixes) {
    $toRemove = $order | Where-Object { $_ -like "$prefix*" }
    foreach ($key in $toRemove) {
      if ($destMap.ContainsKey($key)) {
        $destMap.Remove($key)
        $order = $order | Where-Object { $_ -ne $key }
        $changed = $true
        Write-Host "Removed legacy key: $key"
      }
    }
  }

  foreach ($key in $exampleMap.Keys) {
    if (-not $destMap.ContainsKey($key)) {
      $destMap[$key] = $exampleMap[$key]
      $order += $key
      $changed = $true
      Write-Host "Added missing key: $key"
    }
  }

  # Migrate old Gemini provider to Ollama
  if ($destMap['AI_PROVIDER'] -eq 'gemini' -or $destMap['AI_PROVIDER'] -eq 'openai') {
    $destMap['AI_PROVIDER'] = 'ollama'
    $changed = $true
    Write-Host "Migrated AI_PROVIDER -> ollama"
  }

  if ($changed) {
    $newLines = @()
    foreach ($line in $exampleLines) {
      if ($line -match '^\s*#' -or $line -match '^\s*$') {
        $newLines += $line
        continue
      }
      if ($line -match '^([^=]+)=') {
        $key = $Matches[1].Trim()
        if ($destMap.ContainsKey($key)) {
          $newLines += "$key=$($destMap[$key])"
        }
      }
    }
    foreach ($key in $order) {
      if ($exampleLines -notmatch "^$key=" -and $destMap.ContainsKey($key)) {
        $newLines += "$key=$($destMap[$key])"
      }
    }
    Set-Content -Path $DestPath -Value ($newLines -join "`n") -Encoding UTF8
    Write-Host "Updated $DestPath"
  } else {
    Write-Host "Up to date $DestPath"
  }
}

$pairs = @(
  @{ Source = (Join-Path $root "backend\.env.example"); Destination = (Join-Path $root "backend\.env"); Remove = @('GEMINI_', 'OPENAI_') },
  @{ Source = (Join-Path $root "frontend\.env.example"); Destination = (Join-Path $root "frontend\.env.local"); Remove = @() },
  @{ Source = (Join-Path $root "desktop\.env.example"); Destination = (Join-Path $root "desktop\.env"); Remove = @() },
  @{ Source = (Join-Path $root "mobile\.env.example"); Destination = (Join-Path $root "mobile\.env"); Remove = @() }
)

Write-HgBanner "setup:envs" "Đồng bộ .env từ file mẫu (không ghi đè giá trị đã có)"
foreach ($pair in $pairs) {
  Sync-EnvFile -ExamplePath $pair.Source -DestPath $pair.Destination -RemovePrefixes $pair.Remove
}

Write-Host ""
Write-HgOk "Env đã đồng bộ"
Write-HgInfo "Tiếp theo" "npm run doctor"
