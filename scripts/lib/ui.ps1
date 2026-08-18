# Shared CLI look for PowerShell launchers

function Write-HgBanner {
  param([string]$Title, [string]$Subtitle = '')
  Write-Host ''
  Write-Host '  ────────────────────────────────────────────────────────' -ForegroundColor Cyan
  Write-Host "  HealthGuard  ·  $Title" -ForegroundColor Cyan
  if ($Subtitle) { Write-Host "  $Subtitle" -ForegroundColor DarkGray }
  Write-Host '  ────────────────────────────────────────────────────────' -ForegroundColor Cyan
}

function Write-HgStep {
  param([int]$N, [int]$Total, [string]$Text)
  Write-Host "  [$N/$Total] $Text" -ForegroundColor White
}

function Write-HgOk {
  param([string]$Text)
  Write-Host "  OK   $Text" -ForegroundColor Green
}

function Write-HgWarn {
  param([string]$Text)
  Write-Host "  WAIT $Text" -ForegroundColor Yellow
}

function Write-HgErr {
  param([string]$Text)
  Write-Host "  ERR  $Text" -ForegroundColor Red
}

function Write-HgInfo {
  param([string]$Label, [string]$Value)
  $pad = $Label.PadRight(18)
  Write-Host "  $pad" -NoNewline -ForegroundColor DarkGray
  Write-Host $Value
}

function Write-HgNext {
  param([string[]]$Lines)
  Write-Host ''
  Write-Host '  Việc tiếp theo' -ForegroundColor Cyan
  $i = 1
  foreach ($line in $Lines) {
    Write-Host "  $i. $line"
    $i++
  }
  Write-Host ''
}
