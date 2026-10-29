if (-not ('YaqiLocalProtocolAssociation' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class YaqiLocalProtocolAssociation {
    [DllImport("shell32.dll")]
    private static extern void SHChangeNotify(uint eventId, uint flags, IntPtr first, IntPtr second);
    [DllImport("shlwapi.dll", CharSet = CharSet.Unicode, ExactSpelling = true)]
    private static extern int AssocQueryStringW(uint flags, uint kind, string scheme, string extra, StringBuilder output, ref uint length);
    public static void Refresh() {
        // SHCNE_ASSOCCHANGED, SHCNF_IDLIST | SHCNF_FLUSH. Never opens an application.
        SHChangeNotify(0x08000000, 0x1000, IntPtr.Zero, IntPtr.Zero);
    }
    public static string Command(string scheme) {
        var output = new StringBuilder(4096);
        uint length = 4096;
        // Use an actual null verb: PowerShell converts $null to an empty string here.
        int result = AssocQueryStringW(0x1000, 1, scheme, null, output, ref length);
        if (result != 0) Marshal.ThrowExceptionForHR(result);
        return output.ToString();
    }
}
'@
}

function Register-LocalProtocol([string]$Name, [string]$Command) {
    if ($Name -notmatch '^[a-z][a-z0-9-]{0,63}$') { throw 'Invalid launcher protocol' }
    $scheme = "HKCU:\Software\Classes\$Name"
    if (Test-Path -LiteralPath $scheme) {
        if ((Get-ItemProperty -LiteralPath $scheme).YaqiLocalLauncher -ne '1') { throw "$Name is already registered by another application; it was not changed" }
    }
    New-Item -Path $scheme -Force | Out-Null
    Set-Item -LiteralPath $scheme -Value 'URL:Yaqi local project launcher'
    New-ItemProperty -LiteralPath $scheme -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
    New-ItemProperty -LiteralPath $scheme -Name 'YaqiLocalLauncher' -Value '1' -PropertyType String -Force | Out-Null
    New-Item -Path "$scheme\shell\open\command" -Force | Out-Null
    Set-Item -LiteralPath "$scheme\shell\open\command" -Value $Command
    [YaqiLocalProtocolAssociation]::Refresh()
    if ([YaqiLocalProtocolAssociation]::Command($Name) -cne $Command) { throw 'Windows did not resolve the installed launcher command' }
}

function Assert-LocalProtocolVisible([string]$Name, [string]$Command) {
    $sid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    # Query through the Windows service, independently of this process's registry view.
    $registration = Invoke-CimMethod -Namespace root/default -ClassName StdRegProv -MethodName GetStringValue -Arguments @{
        hDefKey = [uint32]2147483651 # HKEY_USERS; the service's HKCU is not the desktop user's HKCU.
        sSubKeyName = "$sid\Software\Classes\$Name\shell\open\command"
        sValueName = ''
    } -ErrorAction Stop
    if ($registration.ReturnValue -ne 0 -or $registration.sValue -cne $Command) {
        throw 'Launcher registration is not visible to Windows outside this installer. Run install.ps1 in PowerShell opened from your Windows desktop, using the same account as Chrome. No browser or PowerShell security settings need to be changed.'
    }
}
