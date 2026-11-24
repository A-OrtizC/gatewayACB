#!/usr/bin/env bash
set -euo pipefail
umask 077

fail() { printf 'ACB dev: %s\n' "$*" >&2; exit 1; }
random_urlsafe() { openssl rand -base64 "$1" | tr '+/' '-_' | tr -d '=\n'; }
get_env() {
  local path="$1" name="$2" line value result='' seen=0
  [[ -f "$path" ]] || { printf ''; return; }
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" == "$name="* ]] || continue
    value="${line#*=}"; value="${value%$'\r'}"
    if [[ "$value" == \"*\" || "$value" == \'*\' ]]; then value="${value:1:${#value}-2}"; fi
    if (( seen )) && [[ "$value" != "$result" ]]; then fail "Valores duplicados distintos de $name en $path"; fi
    result="$value"; seen=1
  done < "$path"
  printf '%s' "$result"
}
put_env() {
  local path="$1" name="$2" value="$3" line found=0 tmp
  [[ "$value" != *$'\n'* && "$value" != *$'\r'* ]] || fail "Valor inválido de $name"
  if [[ -f "$path" && "$(get_env "$path" "$name")" == "$value" ]]; then
    count="$(grep -c "^$name=" "$path" || true)"
    [[ "$count" != 1 ]] || return 0
  fi
  tmp="$(mktemp "${path}.XXXXXX")"
  if [[ -f "$path" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      if [[ "$line" == "$name="* ]]; then
        if (( ! found )); then printf '%s=%s\n' "$name" "$value" >> "$tmp"; found=1; fi
      else printf '%s\n' "$line" >> "$tmp"; fi
    done < "$path"
  fi
  if (( ! found )); then printf '%s=%s\n' "$name" "$value" >> "$tmp"; fi
  mv "$tmp" "$path"; chmod 600 "$path"
}
url_decode() {
  local input="$1" out='' head hex
  while [[ -n "$input" ]]; do
    head="${input:0:1}"; input="${input:1}"
    if [[ "$head" == '%' ]]; then
      [[ "$input" =~ ^[[:xdigit:]]{2} ]] || fail 'Contraseña URL de truststore mal codificada.'
      hex="${input:0:2}"; input="${input:2}"
      printf -v head '%b' "\\x$hex"
    fi
    out+="$head"
  done
  printf '%s' "$out"
}
check_https() {
  local url="$1" status code attempt
  for ((attempt=1; attempt<=15; attempt++)); do
    status="$(curl --silent --max-time 5 --cacert "$tls/ca.crt" --output /dev/null --write-out '%{http_code}' "$url" 2>/dev/null)" && code=0 || code=$?
    if (( code == 0 && status >= 200 && status < 500 )); then printf 'HTTPS %s: %s\n' "$url" "$status"; return 0; fi
    (( code != 60 )) || fail "Certificado HTTPS rechazado en $url"
    (( attempt == 15 )) || sleep 2
  done
  fail "Fallo HTTPS en $url (HTTP ${status:-000}, curl $code)"
}

root=''; tls_override=''; project_prefix=''; prepare_only=0
while (( $# )); do
  case "$1" in
    --workspace) [[ $# -ge 2 ]] || fail 'Falta ruta tras --workspace'; root="$2"; shift 2 ;;
    --tls-dir) [[ $# -ge 2 ]] || fail 'Falta ruta tras --tls-dir'; tls_override="$2"; shift 2 ;;
    --project-prefix) [[ $# -ge 2 ]] || fail 'Falta valor tras --project-prefix'; project_prefix="$2"; shift 2 ;;
    --prepare-only) prepare_only=1; shift ;;
    *) fail "Opción desconocida: $1" ;;
  esac
done
script_dir="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
[[ -n "$root" ]] || root="$script_dir/../.."
root="$(CDPATH= cd -- "$root" && pwd -P)"
repos=(adminACB geolocaACB gatewayACB webadminACB presentationACB)
for repo in "${repos[@]}"; do [[ -d "$root/$repo" ]] || fail "Falta $repo en $root"; done
for repo in "${repos[@]}"; do
  env_path="$root/$repo/.env"
  if [[ ! -f "$env_path" ]]; then
    if [[ -f "$root/$repo/.env.example" ]]; then cp "$root/$repo/.env.example" "$env_path"
    else printf '# ACB local TLS configuration\n' > "$env_path"; fi
    chmod 600 "$env_path"
  fi
done

declared=''
for repo in "${repos[@]}"; do
  candidate="$(get_env "$root/$repo/.env" ACB_TLS_DIR)"
  [[ -z "$candidate" || -z "$declared" || "$candidate" == "$declared" || -n "$tls_override" ]] || fail 'Los .env contienen directorios TLS diferentes.'
  [[ -z "$candidate" || -n "$declared" ]] || declared="$candidate"
done
if [[ -n "$tls_override" ]]; then tls="$tls_override"
elif [[ -n "${ACB_TLS_DIR:-}" ]]; then tls="$ACB_TLS_DIR"
elif [[ -n "$declared" ]]; then tls="$declared"
else tls="${XDG_DATA_HOME:-$HOME/.local/share}/ACB/tls-dev"; fi
mkdir -p "$tls"; tls="$(CDPATH= cd -- "$tls" && pwd -P)"
case "$tls" in "$root"|"$root"/*) fail 'ACB_TLS_DIR debe estar fuera del workspace.' ;; esac
if [[ -z "$tls_override" && -n "$declared" ]]; then
  [[ "$declared" == "$tls" || "$(CDPATH= cd -- "$declared" && pwd -P)" == "$tls" ]] || fail 'ACB_TLS_DIR del proceso y .env no coinciden.'
fi
chmod 700 "$tls" 2>/dev/null || true
for repo in "${repos[@]}"; do put_env "$root/$repo/.env" ACB_TLS_DIR "$tls"; done
export ACB_TLS_DIR="$tls"

password_file="$tls/.truststore-password"
truststore="$tls/truststore.p12"
stored=''; [[ ! -f "$password_file" ]] || stored="$(cat "$password_file")"
configured="$(get_env "$root/adminACB/.env" ACB_TLS_TRUSTSTORE_PASSWORD_URL)"
decoded=''; [[ -z "$configured" ]] || decoded="$(url_decode "$configured")"
process_decoded=''; [[ -z "${ACB_TLS_TRUSTSTORE_PASSWORD_URL:-}" ]] || process_decoded="$(url_decode "$ACB_TLS_TRUSTSTORE_PASSWORD_URL")"
for candidate in "$stored" "$decoded" "$process_decoded" "${ACB_TLS_TRUSTSTORE_PASSWORD:-}"; do
  for other in "$stored" "$decoded" "$process_decoded" "${ACB_TLS_TRUSTSTORE_PASSWORD:-}"; do
    [[ -z "$candidate" || -z "$other" || "$candidate" == "$other" ]] || fail 'Las contraseñas TLS del proceso y los archivos locales no coinciden.'
  done
done
if [[ -n "$stored" ]]; then password="$stored"
elif [[ -n "$decoded" ]]; then password="$decoded"
elif [[ -n "$process_decoded" ]]; then password="$process_decoded"
elif [[ -n "${ACB_TLS_TRUSTSTORE_PASSWORD:-}" ]]; then password="$ACB_TLS_TRUSTSTORE_PASSWORD"
elif [[ -f "$truststore" ]]; then fail 'Existe truststore.p12 sin contraseña conocida; se conserva intacto.'
else password="$(random_urlsafe 32)"; fi
[[ "${#password}" -ge 12 ]] || fail 'La contraseña del truststore es demasiado corta.'
ACB_TLS_TRUSTSTORE_PASSWORD="$password" "$script_dir/new-acb-tls-dev-certificates.sh" >/dev/null
if [[ ! -f "$password_file" ]]; then printf '%s\n' "$password" > "$password_file"; chmod 600 "$password_file"; fi
# Las contraseñas generadas son base64url; una contraseña existente con caracteres
# reservados se codifica para el parámetro JDBC.
encoded=''
for ((i=0; i<${#password}; i++)); do
  char="${password:i:1}"
  if [[ "$char" =~ [a-zA-Z0-9_.~-] ]]; then encoded+="$char"
  else printf -v hex '%%%02X' "'$char"; encoded+="$hex"; fi
done
put_env "$root/adminACB/.env" ACB_TLS_TRUSTSTORE_PASSWORD_URL "$encoded"
[[ -z "${ACB_TLS_TRUSTSTORE_PASSWORD_URL:-}" || "$ACB_TLS_TRUSTSTORE_PASSWORD_URL" == "$encoded" ]] || fail 'ACB_TLS_TRUSTSTORE_PASSWORD_URL del proceso contradice adminACB/.env.'
export ACB_TLS_TRUSTSTORE_PASSWORD_URL="$encoded"

# Secretos funcionales anteriores a Secure Channel: crear sólo si no existen.
for spec in SESSION_SIGNING_SECRET:48 SESSION_ENCRYPTION_KEY:32; do
  name="${spec%%:*}"; count="${spec##*:}"
  value="$(get_env "$root/webadminACB/.env" "$name")"
  if [[ -z "$value" ]]; then value="$(random_urlsafe "$count")"; put_env "$root/webadminACB/.env" "$name" "$value"; fi
  [[ -z "${!name:-}" || "${!name}" == "$value" ]] || fail "$name del proceso contradice webadminACB/.env."
  export "$name=$value"
done
gateway_token="$(get_env "$root/gatewayACB/.env" GPS_INTERNAL_TOKEN)"
gps_token="$(get_env "$root/geolocaACB/.env" GPS_GATEWAY_INTERNAL_TOKEN)"
[[ -z "$gateway_token" || -z "$gps_token" || "$gateway_token" == "$gps_token" ]] || fail 'Las credenciales GPS/Gateway existentes no coinciden.'
token="${gateway_token:-${gps_token:-}}"; [[ -n "$token" ]] || token="$(random_urlsafe 32)"
put_env "$root/gatewayACB/.env" GPS_INTERNAL_TOKEN "$token"
put_env "$root/geolocaACB/.env" GPS_GATEWAY_INTERNAL_TOKEN "$token"
if [[ -z "$(get_env "$root/geolocaACB/.env" GPS_CONTROL_CREDENTIAL_KEY)" ]]; then
  put_env "$root/geolocaACB/.env" GPS_CONTROL_CREDENTIAL_KEY "$(random_urlsafe 32)"
fi
[[ "$(get_env "$root/geolocaACB/.env" GPS_CONTROL_CREDENTIAL_KEY)" != "$token" ]] || fail 'GPS_CONTROL_CREDENTIAL_KEY debe diferir del token interno de Gateway.'
put_env "$root/geolocaACB/.env" GPS_GATEWAY_BASE_URL 'https://api-gateway:5062'
java_jwt="$(sed -n 's/^[[:space:]]*- ACB_JWT_SECRET=\([^[:space:]#]*\).*/\1/p' "$root/adminACB/docker-compose.yml" | sort -u)"
if [[ -n "$java_jwt" && "$java_jwt" != *$'\n'* ]]; then
  gateway_jwt="$(get_env "$root/gatewayACB/.env" ACB_JWT_SECRET)"
  if [[ -z "$gateway_jwt" ]]; then put_env "$root/gatewayACB/.env" ACB_JWT_SECRET "$java_jwt"
  elif [[ "$gateway_jwt" != "$java_jwt" ]]; then fail 'ACB_JWT_SECRET de Gateway no coincide con el valor de desarrollo de Java; se conserva el valor personal.'; fi
fi
for repo in "${repos[@]}"; do chmod 600 "$root/$repo/.env"; done

command -v docker >/dev/null 2>&1 || fail 'Se requiere Docker Compose.'
port_plan=()
for repo in "${repos[@]}"; do
  compose=docker-compose.yml; [[ "$repo" != webadminACB ]] || compose=compose.yaml
  args=(-f "$compose"); [[ -z "$project_prefix" ]] || args+=(-p "$(printf '%s' "$project_prefix-$repo" | tr '[:upper:]' '[:lower:]')")
  (cd "$root/$repo" && docker compose "${args[@]}" config --quiet) || fail "Compose inválido: $repo"
  configuration="$(cd "$root/$repo" && docker compose "${args[@]}" config --format json)" || fail "Compose inválido: $repo"
  project="$(printf '%s\n' "$configuration" | sed -n 's/^[[:space:]]*"name": "\([^"]*\)".*/\1/p' | head -n 1)"
  [[ -n "$project" ]] || fail "No se pudo identificar el proyecto Compose de $repo"
  while IFS= read -r port; do port_plan+=("$project|$port"); done < <(printf '%s\n' "$configuration" | sed -n 's/^[[:space:]]*"published": "\([0-9]*\)".*/\1/p')
done
if (( prepare_only )); then printf 'Preparación TLS y cinco Compose: OK. Directorio: %s\n' "$tls"; exit 0; fi

for entry in "${port_plan[@]}"; do
  project="${entry%%|*}"; port="${entry##*|}"
  if (: >/dev/tcp/127.0.0.1/"$port") 2>/dev/null; then
    own_ports="$(docker ps --filter "label=com.docker.compose.project=$project" --format '{{.Ports}}')"
    [[ "$own_ports" == *":$port->"* ]] || fail "Puerto $port ocupado por otro proceso o proyecto; no se inició ningún servicio nuevo."
  fi
done
docker network inspect acb-net >/dev/null 2>&1 || docker network create acb-net >/dev/null || fail 'No se pudo crear acb-net.'
for repo in "${repos[@]}"; do
  compose=docker-compose.yml; [[ "$repo" != webadminACB ]] || compose=compose.yaml
  args=(-f "$compose"); [[ -z "$project_prefix" ]] || args+=(-p "$(printf '%s' "$project_prefix-$repo" | tr '[:upper:]' '[:lower:]')")
  (cd "$root/$repo" && docker compose "${args[@]}" up -d --quiet-build --quiet-pull) || fail "No se pudo iniciar $repo; revise puertos y contenedores. No se borró ningún volumen."
done
for repo in "${repos[@]}"; do
  compose=docker-compose.yml; [[ "$repo" != webadminACB ]] || compose=compose.yaml
  args=(-f "$compose"); [[ -z "$project_prefix" ]] || args+=(-p "$(printf '%s' "$project_prefix-$repo" | tr '[:upper:]' '[:lower:]')")
  expected="$(cd "$root/$repo" && docker compose "${args[@]}" config --services)"
  running="$(cd "$root/$repo" && docker compose "${args[@]}" ps --filter status=running --services)"
  while IFS= read -r service; do
    if [[ -n "$service" ]] && ! grep -Fxq "$service" <<< "$running"; then fail "Servicio sin iniciar en $repo: $service"; fi
  done <<< "$expected"
done
command -v curl >/dev/null 2>&1 || fail 'Se requiere curl para comprobar HTTPS.'
presentation_port="${HTTPS_PORT:-$(get_env "$root/presentationACB/.env" HTTPS_PORT)}"; presentation_port="${presentation_port:-8443}"
web_port="${WEB_PORT:-$(get_env "$root/webadminACB/.env" WEB_PORT)}"; web_port="${web_port:-8280}"
check_https 'https://localhost:5062/api/v1/health'
check_https "https://localhost:$presentation_port/"
check_https "https://localhost:$web_port/api/health"
check_https "https://localhost:$presentation_port/api/geo/routes"
printf 'ACB dev: certificados, Compose, red y HTTPS preparados. La CA del navegador se instala manualmente.\n'
