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
$scheme = 'HKCU:\Software\Classes\yaqi-local'
if (Test-Path -LiteralPath $scheme) {
    $existing = Get-ItemProperty -LiteralPath $scheme
    if ($existing.YaqiLocalLauncher -ne '1') { throw 'yaqi-local is already registered by another application; it was not changed' }
}
New-Item -Path $scheme -Force | Out-Null
Set-Item -LiteralPath $scheme -Value 'URL:Yaqi local project launcher'
New-ItemProperty -LiteralPath $scheme -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
New-ItemProperty -LiteralPath $scheme -Name 'YaqiLocalLauncher' -Value '1' -PropertyType String -Force | Out-Null
New-Item -Path "$scheme\shell\open\command" -Force | Out-Null
$powershell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$command = '"{0}" -NoProfile -NonInteractive -WindowStyle Hidden -File "{1}" -ConfigPath "{2}" -NodePath "{3}" -Uri "%1"' -f $powershell, $entry, $configFile, $nodePath
Set-Item -LiteralPath "$scheme\shell\open\command" -Value $command
Write-Output 'Installed yaqi-local for the current Windows user. Remote access was not enabled.'
