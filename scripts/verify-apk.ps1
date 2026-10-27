param(
    [Parameter(Mandatory = $true)][string]$ApkPath,
    [Parameter(Mandatory = $true)][string]$JavaDirectory,
    [string]$AndroidSdkDirectory = "$env:LOCALAPPDATA\Android\Sdk",
    [string]$ReportDirectory,
    [string]$ExpectedVersion,
    [int]$ExpectedVersionCode = 0,
    [string]$ExpectedCertificateSha256
)
$ErrorActionPreference = 'Stop'
$distilabApk = (Resolve-Path -LiteralPath $ApkPath).Path
$distilabTools = Join-Path $AndroidSdkDirectory 'build-tools\36.0.0'
$env:JAVA_HOME = (Resolve-Path -LiteralPath $JavaDirectory).Path
if (-not $ReportDirectory) { $ReportDirectory = Split-Path -Parent $distilabApk }
New-Item -ItemType Directory -Path $ReportDirectory -Force | Out-Null
$distilabSignature = & (Join-Path $distilabTools 'apksigner.bat') verify --verbose --print-certs $distilabApk 2>&1
if ($LASTEXITCODE -ne 0) { throw 'Tanda tangan APK tidak valid.' }
$distilabSignatureText = $distilabSignature -join "`n"
if ($distilabSignatureText -match 'CN=Android Debug') { throw 'APK masih memakai sertifikat debug.' }
$distilabCertificate = [regex]::Match($distilabSignatureText, 'Signer #1 certificate SHA-256 digest: ([0-9a-fA-F]+)').Groups[1].Value.ToLowerInvariant()
if (-not $distilabCertificate) { throw 'Sidik sertifikat APK tidak ditemukan.' }
if ($ExpectedCertificateSha256 -and $distilabCertificate -ne $ExpectedCertificateSha256.ToLowerInvariant()) { throw 'Kunci penandatanganan berbeda dari APK sebelumnya.' }
$distilabSignature | Set-Content -LiteralPath (Join-Path $ReportDirectory 'apk-signature.txt') -Encoding utf8
$distilabBadging = & (Join-Path $distilabTools 'aapt2.exe') dump badging $distilabApk 2>&1
if ($LASTEXITCODE -ne 0) { throw 'Metadata APK gagal dibaca.' }
$distilabBadging | Set-Content -LiteralPath (Join-Path $ReportDirectory 'apk-metadata.txt') -Encoding utf8
$distilabBadgingText = $distilabBadging -join "`n"
if ($distilabBadgingText -notmatch "package: name='id\.distilab\.app'") { throw 'Package APK tidak sesuai DistiLab.' }
if ($distilabBadgingText -notmatch "application-label:'DistiLab'") { throw 'Nama APK tidak sesuai DistiLab.' }
$distilabVersionMatch = [regex]::Match($distilabBadgingText, "package: name='id\.distilab\.app' versionCode='(\d+)' versionName='([^']+)'")
if (-not $distilabVersionMatch.Success) { throw 'Versi APK tidak ditemukan.' }
$distilabVersionCode = [int]$distilabVersionMatch.Groups[1].Value
$distilabVersionName = $distilabVersionMatch.Groups[2].Value
if ($ExpectedVersion -and $distilabVersionName -ne $ExpectedVersion) { throw 'Versi APK tidak sesuai rilis yang diharapkan.' }
if ($ExpectedVersionCode -and $distilabVersionCode -ne $ExpectedVersionCode) { throw 'Version code APK tidak sesuai rilis yang diharapkan.' }
if ($distilabBadgingText -match 'application-debuggable') { throw 'APK masih debuggable.' }
foreach ($distilabBlocked in @('READ_EXTERNAL_STORAGE','WRITE_EXTERNAL_STORAGE','SYSTEM_ALERT_WINDOW','RECORD_AUDIO','VIBRATE')) {
    if ($distilabBadgingText -match "uses-permission[^\r\n]+android\.permission\.$distilabBlocked'") {
        throw "APK masih meminta izin yang diblokir: $distilabBlocked"
    }
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$distilabZip = [System.IO.Compression.ZipFile]::OpenRead($distilabApk)
try {
    $distilabEntries = @($distilabZip.Entries | Select-Object -ExpandProperty FullName)
    $distilabBundle = $distilabZip.GetEntry('assets/index.android.bundle')
    if (-not $distilabBundle -or $distilabBundle.Length -lt 100000) { throw 'Bundle aplikasi offline tidak ditemukan atau kosong.' }
    # Android resource optimization may rename fonts (for example res/CU.ttf).
    # Match the original font content instead of relying on its packaged name.
    $distilabOriginalFont = Join-Path $PSScriptRoot '..\node_modules\@expo\vector-icons\build\vendor\react-native-vector-icons\Fonts\Ionicons.ttf'
    $distilabFontHash = (Get-FileHash -LiteralPath $distilabOriginalFont -Algorithm SHA256).Hash.ToLowerInvariant()
    $distilabFontLength = (Get-Item -LiteralPath $distilabOriginalFont).Length
    $distilabMatchedFont = $null
    foreach ($distilabFontEntry in $distilabZip.Entries) {
        if ($distilabFontEntry.Length -ne $distilabFontLength -or $distilabFontEntry.FullName -notmatch '\.ttf$') { continue }
        $distilabFontStream = $distilabFontEntry.Open()
        $distilabDigest = [System.Security.Cryptography.SHA256]::Create()
        try { $distilabEmbeddedHash = [System.BitConverter]::ToString($distilabDigest.ComputeHash($distilabFontStream)).Replace('-', '').ToLowerInvariant() }
        finally { $distilabDigest.Dispose(); $distilabFontStream.Dispose() }
        if ($distilabEmbeddedHash -eq $distilabFontHash) { $distilabMatchedFont = $distilabFontEntry.FullName; break }
    }
    if (-not $distilabMatchedFont) { throw 'Isi font Ionicons asli tidak ditemukan di APK.' }
    if (-not ($distilabEntries -match '^lib/arm64-v8a/libreactnative\.so$')) { throw 'Library Android ARM64 tidak ditemukan.' }
    $distilabSummary = [ordered]@{
        file = [System.IO.Path]::GetFileName($distilabApk)
        bytes = (Get-Item -LiteralPath $distilabApk).Length
        sha256 = (Get-FileHash -LiteralPath $distilabApk -Algorithm SHA256).Hash.ToLowerInvariant()
        signatureVerified = $true
        package = 'id.distilab.app'
        version = $distilabVersionName
        versionCode = $distilabVersionCode
        certificateSha256 = $distilabCertificate
        debuggable = $false
        embeddedBundleBytes = $distilabBundle.Length
        ioniconsBundled = $true
        ioniconsEntry = $distilabMatchedFont
        arm64LibraryBundled = $true
        checkedAt = [DateTime]::UtcNow.ToString('o')
        physicalDeviceTested = $false
    }
    $distilabSummary | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $ReportDirectory 'apk-verification.json') -Encoding utf8
    $distilabSummary | ConvertTo-Json
} finally { $distilabZip.Dispose() }
