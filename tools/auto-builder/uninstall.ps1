<#
  Remove the EXLM auto-build poller scheduled task (Windows).

  Run:  powershell -ExecutionPolicy Bypass -File tools\auto-builder\uninstall.ps1
#>
$ErrorActionPreference = 'SilentlyContinue'
$TaskName = 'EXLM Auto-Build Poller'
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Host "Removed task '$TaskName' (if it existed)."
