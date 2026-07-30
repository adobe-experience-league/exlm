<#
  One-shot installer for the EXLM auto-build poller (Windows).
  Detects node + claude, reads pollIntervalSeconds from config.json, and registers a
  Windows Task Scheduler task that auto-starts the poller at log on and re-runs it on
  interval (StartWhenAvailable catches up after sleep/wake).

  Run once:  powershell -ExecutionPolicy Bypass -File tools\auto-builder\install.ps1
  Remove:    powershell -ExecutionPolicy Bypass -File tools\auto-builder\uninstall.ps1
#>
$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = (Resolve-Path (Join-Path $ScriptDir '..\..')).Path
$Poller    = Join-Path $ScriptDir 'poller.mjs'
$Config    = Join-Path $ScriptDir 'config.json'
$TaskName  = 'EXLM Auto-Build Poller'

# --- detect binaries ---------------------------------------------------------
$NodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $NodeCmd) { Write-Error "'node' not found on PATH. Install Node >= 18 and retry."; exit 1 }
$ClaudeCmd = Get-Command claude -ErrorAction SilentlyContinue
if (-not $ClaudeCmd) { Write-Error "'claude' CLI not found on PATH. Install Claude Code and retry."; exit 1 }
$NodeBin = $NodeCmd.Source

# --- read interval -----------------------------------------------------------
$Interval = 1800
try { $Interval = [int](Get-Content $Config -Raw | ConvertFrom-Json).pollIntervalSeconds } catch {}
if ($Interval -lt 60) { $Interval = 60 }
$RepeatMinutes = [int][math]::Max(1, [math]::Floor($Interval / 60))

Write-Host "node:     $NodeBin"
Write-Host "claude:   $($ClaudeCmd.Source)"
Write-Host "repo:     $RepoRoot"
Write-Host "interval: $Interval s (repeat every $RepeatMinutes min)"

# --- register scheduled task -------------------------------------------------
$Action = New-ScheduledTaskAction -Execute $NodeBin -Argument "`"$Poller`"" -WorkingDirectory $RepoRoot

$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Trigger.Repetition = (New-ScheduledTaskTrigger -Once -At (Get-Date) `
  -RepetitionInterval (New-TimeSpan -Minutes $RepeatMinutes)).Repetition

$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
  -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger `
  -Settings $Settings -Description 'Polls JIRA for auto-build stories and runs /auto-build.' | Out-Null

Write-Host "Installed task '$TaskName'. It auto-runs at log on and every $RepeatMinutes min."
Write-Host "Force a run now: schtasks /Run /TN `"$TaskName`""
