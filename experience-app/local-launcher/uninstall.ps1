[CmdletBinding(SupportsShouldProcess = $true)]
param()
$ErrorActionPreference = 'Stop'
$scheme = 'HKCU:\Software\Classes\yaqi-local'
if (Test-Path -LiteralPath $scheme) {
    if ((Get-ItemProperty -LiteralPath $scheme).YaqiLocalLauncher -ne '1') { throw 'Registration is not owned by this launcher' }
    if ($PSCmdlet.ShouldProcess($scheme, 'Remove this user launcher registration')) {
        Remove-Item -LiteralPath $scheme -Recurse -Force
    }
}
Write-Output 'Private configuration and running containers were preserved.'
