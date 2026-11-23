param([string]$OutputDirectory)
$ErrorActionPreference = 'Stop'

$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..')).TrimEnd('\', '/')
$requested = if ($OutputDirectory) { $OutputDirectory } elseif ($env:ACB_TLS_DIR) { $env:ACB_TLS_DIR } else { Join-Path $env:LOCALAPPDATA 'ACB\tls-dev' }
$output = [IO.Path]::GetFullPath($requested).TrimEnd('\', '/')
if ($output.Equals($workspace, [StringComparison]::OrdinalIgnoreCase) -or
    $output.StartsWith($workspace + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'El directorio TLS debe estar fuera del workspace ACB.'
}
$manifest = Join-Path $PSScriptRoot 'tls-certificates.tsv'
if (-not (Test-Path -LiteralPath $manifest)) { throw 'Falta el inventario tls-certificates.tsv.' }
$services = @(Import-Csv -LiteralPath $manifest -Delimiter "`t")
if ($services.Count -ne 16) { throw 'Inventario de certificados incompleto.' }
$found = Get-Command openssl -ErrorAction SilentlyContinue
$openssl = if ($found) { $found.Source } else { 'C:\Program Files\Git\usr\bin\openssl.exe' }
if (-not (Test-Path -LiteralPath $openssl)) { throw 'OpenSSL no está disponible (se acepta el de Git for Windows).' }

function OpenSsl([string[]]$Arguments) {
    $previous = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $result = & $openssl @Arguments 2>$null
        $code = $LASTEXITCODE
    } finally { $ErrorActionPreference = $previous }
    if ($code -ne 0) { throw "OpenSSL rechazó un certificado o clave: $($Arguments[0])." }
    return ($result | Out-String).Trim()
}
function Restrict-Key([string]$Path) {
    if ($env:OS -eq 'Windows_NT') {
        $principal = [Security.Principal.WindowsIdentity]::GetCurrent().Name
        & icacls.exe $Path '/inheritance:r' '/grant:r' "$($principal):(F)" 'SYSTEM:(R)' | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "No se pudo restringir el archivo privado $Path." }
    } else { & chmod 600 $Path }
}
function Test-Pair([string]$Certificate, [string]$Key) {
    $certPublic = OpenSsl @('x509', '-in', $Certificate, '-pubkey', '-noout')
    $keyPublic = OpenSsl @('pkey', '-in', $Key, '-pubout')
    if ($certPublic -ne $keyPublic) { throw "El certificado y su clave no coinciden: $Certificate." }
}
function Test-Ca {
    $null = OpenSsl @('x509', '-in', $caCert, '-checkend', '0', '-noout')
    $null = OpenSsl @('verify', '-CAfile', $caCert, $caCert)
    $constraints = OpenSsl @('x509', '-in', $caCert, '-noout', '-ext', 'basicConstraints')
    if (-not $constraints.Contains('CA:TRUE')) { throw 'La CA existente no tiene CA:TRUE.' }
    Test-Pair $caCert $caKey
}
function Test-Service($Service) {
    $name = $Service.name
    $key = Join-Path $output ($name + '.key')
    $crt = Join-Path $output ($name + '.crt')
    $null = OpenSsl @('x509', '-in', $crt, '-checkend', '0', '-noout')
    $null = OpenSsl @('verify', '-CAfile', $caCert, $crt)
    Test-Pair $crt $key
    $san = OpenSsl @('x509', '-in', $crt, '-noout', '-ext', 'subjectAltName')
    $sanBody = (($san -split "`n" | Select-Object -Skip 1) -join '').Trim()
    $available = @($sanBody.Split(',') | ForEach-Object { $_.Trim() })
    foreach ($entry in $Service.san.Split(',')) {
        $expected = if ($entry.StartsWith('IP:')) { 'IP Address:' + $entry.Substring(3) } else { $entry }
        if ($available -notcontains $expected) { throw "Falta SAN $expected en $name." }
    }
    $usage = OpenSsl @('x509', '-in', $crt, '-noout', '-ext', 'extendedKeyUsage')
    if ($usage -notmatch 'TLS Web Server Authentication|serverAuth') { throw "Falta serverAuth en $name." }
}

New-Item -ItemType Directory -Path $output -Force | Out-Null
$caKey = Join-Path $output 'ca.key'; $caCert = Join-Path $output 'ca.crt'
if ((Test-Path -LiteralPath $caKey) -ne (Test-Path -LiteralPath $caCert)) {
    throw 'La CA está incompleta; no se reemplaza automáticamente.'
}
if (-not (Test-Path -LiteralPath $caCert)) {
    $null = OpenSsl @('req', '-x509', '-newkey', 'rsa:3072', '-nodes', '-sha256', '-days', '730', '-subj', '/CN=ACB Local Development CA', '-addext', 'basicConstraints=critical,CA:TRUE', '-addext', 'keyUsage=critical,keyCertSign,cRLSign', '-keyout', $caKey, '-out', $caCert)
    Restrict-Key $caKey
}
Test-Ca

# Preflight: un certificado existente inválido o sin clave detiene la ejecución
# antes de emitir otros certificados. Una clave huérfana sí puede reutilizarse.
foreach ($service in $services) {
    $key = Join-Path $output ($service.name + '.key'); $crt = Join-Path $output ($service.name + '.crt')
    if (Test-Path -LiteralPath $crt) {
        if (-not (Test-Path -LiteralPath $key)) { throw "Falta la clave privada de $($service.name); no se reemplaza el certificado." }
        Test-Service $service
    } elseif (Test-Path -LiteralPath $key) {
        $null = OpenSsl @('pkey', '-in', $key, '-noout')
    }
}

foreach ($service in $services) {
    $key = Join-Path $output ($service.name + '.key'); $crt = Join-Path $output ($service.name + '.crt')
    if (Test-Path -LiteralPath $crt) { continue }
    $csr = Join-Path $output ($service.name + '.csr'); $ext = Join-Path $output ($service.name + '.ext')
    @('basicConstraints=critical,CA:FALSE', 'keyUsage=critical,digitalSignature,keyEncipherment', 'extendedKeyUsage=serverAuth', ('subjectAltName=' + $service.san)) | Set-Content -LiteralPath $ext -Encoding Ascii
    try {
        if (Test-Path -LiteralPath $key) {
            $null = OpenSsl @('req', '-new', '-sha256', '-subj', ('/CN=' + $service.cn), '-key', $key, '-out', $csr)
        } else {
            $null = OpenSsl @('req', '-new', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-subj', ('/CN=' + $service.cn), '-keyout', $key, '-out', $csr)
            Restrict-Key $key
        }
        $null = OpenSsl @('x509', '-req', '-in', $csr, '-CA', $caCert, '-CAkey', $caKey, '-CAcreateserial', '-days', '365', '-sha256', '-extfile', $ext, '-out', $crt)
        Test-Service $service
    } finally { Remove-Item -LiteralPath $csr, $ext -Force -ErrorAction SilentlyContinue }
}

$mongoPem = Join-Path $output 'mongo.pem'
if (Test-Path -LiteralPath $mongoPem) {
    $pemPublic = OpenSsl @('pkey', '-in', $mongoPem, '-pubout')
    $certPublic = OpenSsl @('x509', '-in', (Join-Path $output 'mongo.crt'), '-pubkey', '-noout')
    $pemFingerprint = OpenSsl @('x509', '-in', $mongoPem, '-fingerprint', '-sha256', '-noout')
    $certFingerprint = OpenSsl @('x509', '-in', (Join-Path $output 'mongo.crt'), '-fingerprint', '-sha256', '-noout')
    if ($pemPublic -ne $certPublic -or $pemFingerprint -ne $certFingerprint) { throw 'mongo.pem no coincide con mongo.key/mongo.crt.' }
} else {
    [IO.File]::WriteAllBytes($mongoPem, ([IO.File]::ReadAllBytes((Join-Path $output 'mongo.key')) + [Text.Encoding]::ASCII.GetBytes("`n") + [IO.File]::ReadAllBytes((Join-Path $output 'mongo.crt'))))
    Restrict-Key $mongoPem
}

$truststore = Join-Path $output 'truststore.p12'
if (-not $env:ACB_TLS_TRUSTSTORE_PASSWORD) {
    Write-Warning 'ACB_TLS_TRUSTSTORE_PASSWORD no está definido; truststore.p12 no se creó ni validó.'
} elseif ($env:ACB_TLS_TRUSTSTORE_PASSWORD.Length -lt 12 -or $env:ACB_TLS_TRUSTSTORE_PASSWORD -match '[\x00-\x1f]') {
    throw 'ACB_TLS_TRUSTSTORE_PASSWORD debe tener al menos 12 caracteres y ningún control.'
} else {
    $keytool = Get-Command keytool -ErrorAction Stop
    if (-not (Test-Path -LiteralPath $truststore)) {
        if ($env:ACB_TLS_TRUSTSTORE_PASSWORD -notmatch '^[A-Za-z0-9_-]{12,}$') { throw 'Para crear un truststore nuevo use una contraseña URL-safe.' }
        $previous = $ErrorActionPreference
        try {
            $ErrorActionPreference = 'Continue'
            & $keytool.Source -importcert -trustcacerts -noprompt -alias acb-dev-ca -file $caCert -keystore $truststore -storetype PKCS12 -storepass $env:ACB_TLS_TRUSTSTORE_PASSWORD 2>$null | Out-Null
            $code = $LASTEXITCODE
        } finally { $ErrorActionPreference = $previous }
        if ($code -ne 0) { throw 'No se pudo crear truststore.p12.' }
    }
    $exported = Join-Path $output 'truststore-check.tmp'
    try {
        $previous = $ErrorActionPreference
        try {
            $ErrorActionPreference = 'Continue'
            & $keytool.Source -exportcert -rfc -alias acb-dev-ca -keystore $truststore -storetype PKCS12 -storepass $env:ACB_TLS_TRUSTSTORE_PASSWORD -file $exported 2>$null | Out-Null
            $code = $LASTEXITCODE
        } finally { $ErrorActionPreference = $previous }
        if ($code -ne 0) { throw 'El truststore existente no se puede abrir.' }
        $expected = OpenSsl @('x509', '-in', $caCert, '-fingerprint', '-sha256', '-noout')
        $actual = OpenSsl @('x509', '-in', $exported, '-fingerprint', '-sha256', '-noout')
        if ($expected -ne $actual) { throw 'El truststore no contiene la CA local actual.' }
    } finally { Remove-Item -LiteralPath $exported -Force -ErrorAction SilentlyContinue }
}
Write-Output "Material TLS validado en $output. No se reemplazaron archivos existentes."
Write-Output 'La confianza del navegador en ca.crt debe configurarse manualmente.'
