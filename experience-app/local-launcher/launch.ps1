param(
    [Parameter(Mandatory = $true)][string]$ConfigPath,
    [Parameter(Mandatory = $true)][string]$NodePath,
    [Parameter(Mandatory = $true)][ValidatePattern('^yaqi-local://launch\?ticket=[A-Za-z0-9_.-]{1,1800}$')][string]$Uri
)
$ErrorActionPreference = 'Stop'
if ($args.Count -ne 0) { throw 'Unexpected arguments' }
if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf) -or -not (Test-Path -LiteralPath $NodePath -PathType Leaf)) { throw 'Launcher configuration is missing' }
$entry = Join-Path $PSScriptRoot 'index.mjs'
foreach ($value in @($entry, $ConfigPath, $NodePath)) {
    if ($value.Contains('"') -or $value.Contains("`r") -or $value.Contains("`n")) { throw 'Invalid path' }
}
$arguments = '--no-warnings "{0}" --config "{1}" "{2}"' -f $entry, $ConfigPath, $Uri
Start-Process -FilePath $NodePath -ArgumentList $arguments -WindowStyle Hidden
