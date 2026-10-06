$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
foreach ($process in Get-CimInstance Win32_Process) {
    $command = $process.CommandLine
    $api = $process.Name -in @('dotnet.exe', 'DeviceTestApi.exe') -and $command -match '[/\\]tools[/\\]DeviceTestApi[/\\].*DeviceTestApi\.(dll|exe)'
    $expo = $process.Name -eq 'node.exe' -and $command -like "*$projectRoot*" -and $command -match 'expo[/\\]bin[/\\]cli.*--port\s+8082(?:\s|$)'
    if ($api -or $expo) { Stop-Process -Id $process.ProcessId; Write-Host "Parado apenas o processo de testes $($process.ProcessId)." }
}
Write-Host 'Base descartavel e ficheiros locais preservados. API/Expo habituais nao foram selecionados.'
