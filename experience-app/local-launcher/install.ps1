param([Parameter(Mandatory = $true)][string]$ConfigPath)
$ErrorActionPreference = 'Stop'
$configFile = (Resolve-Path -LiteralPath $ConfigPath).Path
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$entry = Join-Path $PSScriptRoot 'launch.ps1'
foreach ($value in @($configFile, $nodePath, $entry)) {
    if ($value.Contains('"') -or $value.Contains("`r") -or $value.Contains("`n")) { throw 'Invalid path' }
}
& $nodePath (Join-Path $PSScriptRoot 'validate.mjs') $configFile
if ($LASTEXITCODE -ne 0) { throw 'Configuration validation failed' }
$powershell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$command = '"{0}" -NoProfile -NonInteractive -WindowStyle Hidden -File "{1}" -ConfigPath "{2}" -NodePath "{3}" -Uri "%1"' -f $powershell, $entry, $configFile, $nodePath
. (Join-Path $PSScriptRoot 'protocol.ps1')
Register-LocalProtocol -Name 'yaqi-local' -Command $command
Assert-LocalProtocolVisible -Name 'yaqi-local' -Command $command
Write-Output 'Installed yaqi-local for the current Windows user. Remote access was not enabled.'
