param([string]$ApiHost)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $ApiHost) {
    $ApiHost = (Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } | Select-Object -First 1).IPv4Address.IPAddress
}
if (-not $ApiHost) { throw 'Indica -ApiHost com o IPv4 da maquina onde corre a API de testes.' }
$health = Invoke-RestMethod -Uri "http://${ApiHost}:5099/device-test/health" -TimeoutSec 5
if ($health.environment -ne 'DeviceTests' -or $health.database -ne 'MeepleBoard_DeviceTests') { throw 'O destino nao e a API descartavel esperada.' }
$variables = @('EXPO_PUBLIC_API_MODE', 'EXPO_PUBLIC_API_PORT', 'EXPO_PUBLIC_API_BASEPATH', 'REACT_NATIVE_PACKAGER_HOSTNAME')
$original = @{}
foreach ($name in $variables) { $original[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
try {
    $env:EXPO_PUBLIC_API_MODE = 'local'
    $env:EXPO_PUBLIC_API_PORT = '5099'
    $env:EXPO_PUBLIC_API_BASEPATH = '/MeepleBoard'
    $env:REACT_NATIVE_PACKAGER_HOSTNAME = $ApiHost
    Write-Host "API de testes: http://${ApiHost}:5099/MeepleBoard"
    Write-Host 'Expo Go: abre o QR na mesma rede local. A configuracao habitual nao foi editada.'
    Push-Location $projectRoot
    try { & npm.cmd run start -- --lan --port 8082 --clear; if ($LASTEXITCODE -ne 0) { throw 'O Expo terminou com erro.' } }
    finally { Pop-Location }
} finally {
    foreach ($name in $variables) { [Environment]::SetEnvironmentVariable($name, $original[$name], 'Process') }
}
