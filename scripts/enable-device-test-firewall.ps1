param([string]$ApiHost)
$ErrorActionPreference = 'Stop'
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Executa este script numa PowerShell como Administrador.' }
if (-not $ApiHost) { $ApiHost = (Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } | Select-Object -First 1).IPv4Address.IPAddress }
$address = Get-NetIPAddress -AddressFamily IPv4 | Where-Object IPAddress -eq $ApiHost | Select-Object -First 1
if (-not $address) { throw 'O endereco indicado nao pertence a esta maquina.' }
$apiProgram = 'C:\Users\ruben\Desktop\ProjectoJogos\MeepleBoardApi\tools\DeviceTestApi\bin\DeviceTests\net9.0\DeviceTestApi.exe'
foreach ($entry in @(@('API', 5099, $apiProgram), @('Expo', 8082, (Get-Command node).Source))) {
    $name = 'MeepleBoard-DeviceTests-' + $entry[0]
    $existing = Get-NetFirewallRule -Name $name -ErrorAction SilentlyContinue
    if ($existing) {
        if ($existing.DisplayName -ne "MeepleBoard Device Tests $($entry[0])") { throw "A regra $name nao pertence a este ambiente." }
        Set-NetFirewallRule -Name $name -Direction Inbound -Action Allow -Protocol TCP -LocalPort $entry[1] -LocalAddress $ApiHost -RemoteAddress LocalSubnet -InterfaceAlias $address.InterfaceAlias -Profile Any -Program $entry[2]
        Write-Host "$name limitada a porta $($entry[1]) na interface LAN."; continue
    }
    New-NetFirewallRule -Name $name -DisplayName "MeepleBoard Device Tests $($entry[0])" -Direction Inbound -Action Allow -Protocol TCP -LocalPort $entry[1] -LocalAddress $ApiHost -RemoteAddress LocalSubnet -InterfaceAlias $address.InterfaceAlias -Profile Any -Program $entry[2] | Out-Null
    Write-Host "$name criada apenas para a interface LAN, sub-rede local e porta $($entry[1])."
}
