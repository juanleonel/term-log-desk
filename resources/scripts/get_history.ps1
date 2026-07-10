# Lee el historial de PowerShell de forma segura
$historyPath = "$env:APPDATA\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt"

if (Test-Path $historyPath) {
  Get-Content $historyPath | Select-Object -Last 1000
} else {
  Write-Output "NO_HISTORY_FILE_FOUND"
}
