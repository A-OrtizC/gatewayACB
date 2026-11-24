param(
    [string]$WorkspaceRoot = '',
    [string]$TlsDirectory = '',
    [string]$ProjectPrefix = '',
    [switch]$PrepareOnly
)
$ErrorActionPreference = 'Stop'

function Fail([string]$Message) { throw "ACB dev: $Message" }
function Random-UrlSafe([int]$Count) {
    $bytes = New-Object byte[] $Count
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}
function Read-Env([string]$Path, [string]$Name) {
    if (-not (Test-Path -LiteralPath $Path)) { return '' }
    $found = @()
    foreach ($line in [IO.File]::ReadAllLines($Path)) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$' -and $Matches[1] -eq $Name) {
            $found += $Matches[2].Trim().Trim('"', "'")
        }
    }
    if ($found.Count -gt 1 -and @($found | Select-Object -Unique).Count -gt 1) { Fail "Valores duplicados distintos de $Name en $Path" }
    return $(if ($found.Count) { $found[-1] } else { '' })
}
function Write-Env([string]$Path, [string]$Name, [string]$Value) {
    if ($Value -match '[\r\n]') { Fail "Valor no válido para $Name" }
    if (Test-Path -LiteralPath $Path) {
        $existing = @([IO.File]::ReadAllLines($Path) | Where-Object { $_ -match ('^\s*' + [regex]::Escape($Name) + '=') })
        if ($existing.Count -eq 1 -and $existing[0] -ceq "$Name=$Value") { return }
    }
    $lines = New-Object 'System.Collections.Generic.List[string]'
    if (Test-Path -LiteralPath $Path) { $lines.AddRange([string[]][IO.File]::ReadAllLines($Path)) }
    $seen = $false
    for ($i = $lines.Count - 1; $i -ge 0; $i--) {
        if ($lines[$i] -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=' -and $Matches[1] -eq $Name) {
            if ($seen) { $lines.RemoveAt($i) } else { $lines[$i] = "$Name=$Value"; $seen = $true }
        }
    }
    if (-not $seen) { $lines.Add("$Name=$Value") }
    [IO.File]::WriteAllText($Path, (($lines -join "`n") + "`n"), [Text.UTF8Encoding]::new($false))
}
function Protect-File([string]$Path) {
    $principal = [Security.Principal.WindowsIdentity]::GetCurrent().Name
    & icacls.exe $Path '/inheritance:r' '/grant:r' "$($principal):(F)" 'SYSTEM:(R)' | Out-Null
    if ($LASTEXITCODE -ne 0) { Fail "No se pudieron restringir permisos de $Path" }
}
function Check-Https([string]$Url, [string]$Ca) {
    for ($attempt = 1; $attempt -le 15; $attempt++) {
        $previous = $ErrorActionPreference
        try {
            $ErrorActionPreference = 'Continue'
            # La CA local no publica CRL/OCSP. Sigue verificándose CA y hostname.
            $result = & curl.exe --silent --show-error --ssl-revoke-best-effort --max-time 5 --cacert $Ca --output NUL --write-out '%{http_code}' $Url 2>&1
            $code = $LASTEXITCODE
        } finally { $ErrorActionPreference = $previous }
        $status = [string]($result | Select-Object -Last 1)
        if ($code -eq 0 -and [int]$status -ge 200 -and [int]$status -lt 500) { Write-Output "HTTPS ${Url}: $status"; return }
        if ($code -eq 60) { Fail "Certificado HTTPS rechazado en $Url ($result)" }
        if ($attempt -lt 15) { Start-Sleep -Seconds 2 }
    }
    Fail "Fallo HTTPS en $Url ($result)"
}

$root = if ($WorkspaceRoot) { [IO.Path]::GetFullPath($WorkspaceRoot) } else { [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..')) }
$repos = @('adminACB', 'geolocaACB', 'gatewayACB', 'webadminACB', 'presentationACB')
foreach ($repo in $repos) { if (-not (Test-Path -LiteralPath (Join-Path $root $repo) -PathType Container)) { Fail "Falta $repo en $root" } }
$envFiles = @{}
foreach ($repo in $repos) {
    $dir = Join-Path $root $repo
    $envFiles[$repo] = Join-Path $dir '.env'
    if (-not (Test-Path -LiteralPath $envFiles[$repo])) {
        $example = Join-Path $dir '.env.example'
        if (Test-Path -LiteralPath $example) { [IO.File]::Copy($example, $envFiles[$repo]) }
        else { [IO.File]::WriteAllText($envFiles[$repo], "# ACB local TLS configuration`n", [Text.UTF8Encoding]::new($false)) }
    }
}

$declared = @($repos | ForEach-Object { Read-Env $envFiles[$_] 'ACB_TLS_DIR' } | Where-Object { $_ })
if ($TlsDirectory) { $candidate = $TlsDirectory }
elseif ($env:ACB_TLS_DIR) { $candidate = $env:ACB_TLS_DIR }
elseif (@($declared | Select-Object -Unique).Count -eq 1) { $candidate = $declared[0] }
elseif ($declared.Count) { Fail 'Los .env contienen directorios TLS diferentes; indique -TlsDirectory explícitamente.' }
else { $candidate = Join-Path $env:LOCALAPPDATA 'ACB\tls-dev' }
$tls = [IO.Path]::GetFullPath($candidate).TrimEnd('\', '/')
if ($tls.Equals($root.TrimEnd('\', '/'), [StringComparison]::OrdinalIgnoreCase) -or $tls.StartsWith($root.TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { Fail 'ACB_TLS_DIR debe estar fuera del workspace.' }
if (-not $TlsDirectory) {
    foreach ($value in $declared) { if (-not [IO.Path]::GetFullPath($value).Equals($tls, [StringComparison]::OrdinalIgnoreCase)) { Fail 'ACB_TLS_DIR del proceso y .env no coinciden; corrija el conflicto o use -TlsDirectory.' } }
}
$composeTls = $tls.Replace('\', '/')
foreach ($repo in $repos) { Write-Env $envFiles[$repo] 'ACB_TLS_DIR' $composeTls }
[IO.Directory]::CreateDirectory($tls) | Out-Null

$passwordFile = Join-Path $tls '.truststore-password'
$truststore = Join-Path $tls 'truststore.p12'
$stored = if (Test-Path -LiteralPath $passwordFile) { [IO.File]::ReadAllText($passwordFile).Trim() } else { '' }
$configured = Read-Env $envFiles['adminACB'] 'ACB_TLS_TRUSTSTORE_PASSWORD_URL'
$decoded = if ($configured) { [Uri]::UnescapeDataString($configured) } else { '' }
$processDecoded = if ($env:ACB_TLS_TRUSTSTORE_PASSWORD_URL) { [Uri]::UnescapeDataString($env:ACB_TLS_TRUSTSTORE_PASSWORD_URL) } else { '' }
if ($stored -and $decoded -and $stored -cne $decoded) { Fail 'La contraseña local del truststore y adminACB/.env no coinciden.' }
foreach ($candidatePassword in @($stored, $decoded, $processDecoded, $env:ACB_TLS_TRUSTSTORE_PASSWORD)) {
    foreach ($otherPassword in @($stored, $decoded, $processDecoded, $env:ACB_TLS_TRUSTSTORE_PASSWORD)) {
        if ($candidatePassword -and $otherPassword -and $candidatePassword -cne $otherPassword) { Fail 'Las contraseñas TLS del proceso y los archivos locales no coinciden.' }
    }
}
$password = if ($stored) { $stored } elseif ($decoded) { $decoded } elseif ($processDecoded) { $processDecoded } elseif ($env:ACB_TLS_TRUSTSTORE_PASSWORD) { $env:ACB_TLS_TRUSTSTORE_PASSWORD } elseif (Test-Path -LiteralPath $truststore) { Fail 'Existe truststore.p12 pero falta su contraseña local; se conserva intacto.' } else { Random-UrlSafe 32 }
if ($password.Length -lt 12) { Fail 'La contraseña del truststore es demasiado corta.' }
$oldPassword = $env:ACB_TLS_TRUSTSTORE_PASSWORD
try {
    $env:ACB_TLS_TRUSTSTORE_PASSWORD = $password
    & (Join-Path $PSScriptRoot 'New-AcbTlsDevCertificates.ps1') -OutputDirectory $tls
    if (-not $?) { Fail 'Falló la preparación de certificados.' }
} finally { $env:ACB_TLS_TRUSTSTORE_PASSWORD = $oldPassword }
if (-not (Test-Path -LiteralPath $passwordFile)) {
    [IO.File]::WriteAllText($passwordFile, $password + "`n", [Text.UTF8Encoding]::new($false))
    Protect-File $passwordFile
}
$encoded = [Uri]::EscapeDataString($password)
Write-Env $envFiles['adminACB'] 'ACB_TLS_TRUSTSTORE_PASSWORD_URL' $encoded
if ($env:ACB_TLS_TRUSTSTORE_PASSWORD_URL -and $env:ACB_TLS_TRUSTSTORE_PASSWORD_URL -cne $encoded) { Fail 'ACB_TLS_TRUSTSTORE_PASSWORD_URL del proceso contradice adminACB/.env.' }

# Estos secretos ya eran requisitos funcionales del despliegue anterior; sólo se crean si faltan.
foreach ($pair in @(@('SESSION_SIGNING_SECRET', 48), @('SESSION_ENCRYPTION_KEY', 32))) {
    $name = [string]$pair[0]
    if (-not (Read-Env $envFiles['webadminACB'] $name)) { Write-Env $envFiles['webadminACB'] $name (Random-UrlSafe ([int]$pair[1])) }
    if ([Environment]::GetEnvironmentVariable($name) -and [Environment]::GetEnvironmentVariable($name) -cne (Read-Env $envFiles['webadminACB'] $name)) { Fail "$name del proceso contradice webadminACB/.env." }
}
$gatewayToken = Read-Env $envFiles['gatewayACB'] 'GPS_INTERNAL_TOKEN'
$gpsToken = Read-Env $envFiles['geolocaACB'] 'GPS_GATEWAY_INTERNAL_TOKEN'
if ($gatewayToken -and $gpsToken -and $gatewayToken -cne $gpsToken) { Fail 'Las credenciales GPS/Gateway existentes no coinciden.' }
$token = if ($gatewayToken) { $gatewayToken } elseif ($gpsToken) { $gpsToken } else { Random-UrlSafe 32 }
Write-Env $envFiles['gatewayACB'] 'GPS_INTERNAL_TOKEN' $token
Write-Env $envFiles['geolocaACB'] 'GPS_GATEWAY_INTERNAL_TOKEN' $token
if (-not (Read-Env $envFiles['geolocaACB'] 'GPS_CONTROL_CREDENTIAL_KEY')) { Write-Env $envFiles['geolocaACB'] 'GPS_CONTROL_CREDENTIAL_KEY' (Random-UrlSafe 32) }
if ((Read-Env $envFiles['geolocaACB'] 'GPS_CONTROL_CREDENTIAL_KEY') -ceq $token) { Fail 'GPS_CONTROL_CREDENTIAL_KEY debe diferir del token interno de Gateway.' }
Write-Env $envFiles['geolocaACB'] 'GPS_GATEWAY_BASE_URL' 'https://api-gateway:5062'
$javaCompose = [IO.File]::ReadAllText((Join-Path $root 'adminACB/docker-compose.yml'))
$javaJwt = @([regex]::Matches($javaCompose, '(?m)^\s*- ACB_JWT_SECRET=([^\s#]+)') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique)
if ($javaJwt.Count -eq 1) {
    $gatewayJwt = Read-Env $envFiles['gatewayACB'] 'ACB_JWT_SECRET'
    if (-not $gatewayJwt) { Write-Env $envFiles['gatewayACB'] 'ACB_JWT_SECRET' $javaJwt[0] }
    elseif ($gatewayJwt -cne $javaJwt[0]) { Fail 'ACB_JWT_SECRET de Gateway no coincide con el valor de desarrollo de Java; se conserva el valor personal.' }
}
foreach ($repo in $repos) { Protect-File $envFiles[$repo] }

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Fail 'Se requiere Docker Compose.' }
$compose = @{
    adminACB = 'docker-compose.yml'; geolocaACB = 'docker-compose.yml'; gatewayACB = 'docker-compose.yml';
    webadminACB = 'compose.yaml'; presentationACB = 'docker-compose.yml'
}
$portPlan = @()
foreach ($repo in $repos) {
    Push-Location (Join-Path $root $repo)
    try {
        $arguments = @('compose', '-f', $compose[$repo])
        if ($ProjectPrefix) { $arguments += @('-p', ("$ProjectPrefix-$repo").ToLowerInvariant()) }
        & docker @arguments config --quiet
        if ($LASTEXITCODE -ne 0) { Fail "Compose inválido: $repo" }
        $configuration = (& docker @arguments config --format json | Out-String | ConvertFrom-Json)
        if ($LASTEXITCODE -ne 0) { Fail "Compose inválido: $repo" }
        foreach ($service in $configuration.services.PSObject.Properties) {
            foreach ($port in @($service.Value.ports)) {
                if ($port -and $port.published) { $portPlan += [pscustomobject]@{ Project = $configuration.name; Port = [int]$port.published } }
            }
        }
    }
    finally { Pop-Location }
}
if ($PrepareOnly) { Write-Output "Preparación TLS y cinco Compose: OK. Directorio: $tls"; return }

foreach ($entry in $portPlan) {
    $occupied = @(Get-NetTCPConnection -State Listen -LocalPort $entry.Port -ErrorAction SilentlyContinue).Count -gt 0
    if (-not $occupied) { continue }
    $ownPorts = (& docker ps --filter "label=com.docker.compose.project=$($entry.Project)" --format '{{.Ports}}' | Out-String)
    if ($ownPorts -notmatch (':' + $entry.Port + '->')) { Fail "Puerto $($entry.Port) ocupado por otro proceso o proyecto; no se inició ningún servicio nuevo." }
}
& docker network inspect acb-net *> $null
if ($LASTEXITCODE -ne 0) { & docker network create acb-net | Out-Null; if ($LASTEXITCODE -ne 0) { Fail 'No se pudo crear acb-net.' } }
foreach ($repo in $repos) {
    Push-Location (Join-Path $root $repo)
    try {
        $arguments = @('compose', '-f', $compose[$repo])
        if ($ProjectPrefix) { $arguments += @('-p', ("$ProjectPrefix-$repo").ToLowerInvariant()) }
        & docker @arguments up -d --quiet-build --quiet-pull
        if ($LASTEXITCODE -ne 0) { Fail "No se pudo iniciar $repo. Revise puertos y contenedores; no se borró ningún volumen." }
    } finally { Pop-Location }
}
foreach ($repo in $repos) {
    Push-Location (Join-Path $root $repo)
    try {
        $arguments = @('compose', '-f', $compose[$repo])
        if ($ProjectPrefix) { $arguments += @('-p', ("$ProjectPrefix-$repo").ToLowerInvariant()) }
        $expected = @(& docker @arguments config --services)
        $running = @(& docker @arguments ps --filter status=running --services)
        $missing = @($expected | Where-Object { $running -notcontains $_ })
        if ($missing.Count) { Fail "Servicios sin iniciar en ${repo}: $($missing -join ', ')" }
    } finally { Pop-Location }
}
$presentationPort = if ($env:HTTPS_PORT) { $env:HTTPS_PORT } elseif (Read-Env $envFiles['presentationACB'] 'HTTPS_PORT') { Read-Env $envFiles['presentationACB'] 'HTTPS_PORT' } else { '8443' }
$webPort = if ($env:WEB_PORT) { $env:WEB_PORT } elseif (Read-Env $envFiles['webadminACB'] 'WEB_PORT') { Read-Env $envFiles['webadminACB'] 'WEB_PORT' } else { '8280' }
Check-Https 'https://localhost:5062/api/v1/health' (Join-Path $tls 'ca.crt')
Check-Https "https://localhost:$presentationPort/" (Join-Path $tls 'ca.crt')
Check-Https "https://localhost:$webPort/api/health" (Join-Path $tls 'ca.crt')
Check-Https "https://localhost:$presentationPort/api/geo/routes" (Join-Path $tls 'ca.crt')
Write-Output 'ACB dev: certificados, Compose, red y comprobaciones HTTPS preparados. La confianza del navegador en ca.crt se configura por usuario.'
