#!/usr/bin/env bash
set -euo pipefail
umask 077

fail() { printf 'ACB TLS: %s\n' "$*" >&2; exit 1; }
command -v openssl >/dev/null 2>&1 || fail 'OpenSSL no está instalado.'

script_dir="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
workspace="$(CDPATH= cd -- "$script_dir/../.." && pwd -P)"
manifest="$script_dir/tls-certificates.tsv"
[[ -f "$manifest" ]] || fail 'Falta tls-certificates.tsv.'
output="${ACB_TLS_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/ACB/tls-dev}"
[[ "$output" = /* ]] || output="$PWD/$output"
mkdir -p "$output"
output="$(CDPATH= cd -- "$output" && pwd -P)"
case "$output" in "$workspace"|"$workspace"/*) fail 'El directorio TLS debe estar fuera del workspace ACB.' ;; esac
chmod 700 "$output" 2>/dev/null || true

ca_key="$output/ca.key"
ca_crt="$output/ca.crt"
ossl() { openssl "$@" >/dev/null 2>&1 || fail "OpenSSL rechazó un certificado o clave: $1."; }
ossl_text() { local result; result="$(openssl "$@" 2>/dev/null)" || fail "OpenSSL rechazó un certificado o clave: $1."; printf '%s' "$result"; }
pair_matches() {
  local cert_public key_public
  cert_public="$(ossl_text x509 -in "$1" -pubkey -noout)"
  key_public="$(ossl_text pkey -in "$2" -pubout)"
  [[ "$cert_public" == "$key_public" ]] || fail "El certificado y su clave no coinciden: $1."
}
validate_ca() {
  ossl x509 -in "$ca_crt" -checkend 0 -noout
  ossl verify -CAfile "$ca_crt" "$ca_crt"
  [[ "$(ossl_text x509 -in "$ca_crt" -noout -ext basicConstraints)" == *'CA:TRUE'* ]] || fail 'La CA existente no tiene CA:TRUE.'
  pair_matches "$ca_crt" "$ca_key"
}
validate_service() {
  local name="$1" san_list="$2" crt="$output/$1.crt" key="$output/$1.key"
  local san_info usage entry expected
  ossl x509 -in "$crt" -checkend 0 -noout
  ossl verify -CAfile "$ca_crt" "$crt"
  pair_matches "$crt" "$key"
  san_info="$(ossl_text x509 -in "$crt" -noout -ext subjectAltName)"
  san_info="${san_info#*$'\n'}"
  san_info="${san_info//$'\n'/}"
  san_info="${san_info// /}"
  san_info=",$san_info,"
  IFS=',' read -r -a expected_sans <<< "$san_list"
  for entry in "${expected_sans[@]}"; do
    expected="$entry"
    [[ "$entry" != IP:* ]] || expected="IP Address:${entry#IP:}"
    expected="${expected// /}"
    [[ "$san_info" == *",$expected,"* ]] || fail "Falta SAN $expected en $name."
  done
  usage="$(ossl_text x509 -in "$crt" -noout -ext extendedKeyUsage)"
  [[ "$usage" == *'TLS Web Server Authentication'* || "$usage" == *serverAuth* ]] || fail "Falta serverAuth en $name."
}

if [[ -f "$ca_key" && ! -f "$ca_crt" || -f "$ca_crt" && ! -f "$ca_key" ]]; then
  fail 'La CA está incompleta; no se reemplaza automáticamente.'
fi
if [[ ! -f "$ca_crt" ]]; then
  ossl req -x509 -newkey rsa:3072 -nodes -sha256 -days 730 -subj '/CN=ACB Local Development CA' \
    -addext 'basicConstraints=critical,CA:TRUE' -addext 'keyUsage=critical,keyCertSign,cRLSign' \
    -keyout "$ca_key" -out "$ca_crt"
  chmod 600 "$ca_key"
fi
validate_ca

service_count=0
while IFS=$'\t' read -r name cn san; do
  san="${san%$'\r'}"
  [[ "$name" == name ]] && continue
  [[ -n "$name" && -n "$cn" && -n "$san" ]] || fail 'Inventario de certificados incompleto.'
  service_count=$((service_count + 1))
  crt="$output/$name.crt"; key="$output/$name.key"
  if [[ -f "$crt" ]]; then
    [[ -f "$key" ]] || fail "Falta la clave privada de $name; no se reemplaza el certificado."
    validate_service "$name" "$san"
  elif [[ -f "$key" ]]; then
    ossl pkey -in "$key" -noout
  fi
done < "$manifest"
[[ "$service_count" -eq 16 ]] || fail 'Inventario de certificados incompleto.'

while IFS=$'\t' read -r name cn san; do
  san="${san%$'\r'}"
  [[ "$name" == name ]] && continue
  crt="$output/$name.crt"; key="$output/$name.key"
  [[ ! -f "$crt" ]] || continue
  csr="$output/$name.csr"; ext="$output/$name.ext"
  printf '%s\n' 'basicConstraints=critical,CA:FALSE' 'keyUsage=critical,digitalSignature,keyEncipherment' \
    'extendedKeyUsage=serverAuth' "subjectAltName=$san" > "$ext"
  if [[ -f "$key" ]]; then
    ossl req -new -sha256 -subj "/CN=$cn" -key "$key" -out "$csr"
  else
    ossl req -new -newkey rsa:2048 -nodes -sha256 -subj "/CN=$cn" -keyout "$key" -out "$csr"
    chmod 600 "$key"
  fi
  ossl x509 -req -in "$csr" -CA "$ca_crt" -CAkey "$ca_key" -CAcreateserial -days 365 -sha256 -extfile "$ext" -out "$crt"
  rm -f "$csr" "$ext"
  validate_service "$name" "$san"
done < "$manifest"

mongo_pem="$output/mongo.pem"
if [[ -f "$mongo_pem" ]]; then
  [[ "$(ossl_text pkey -in "$mongo_pem" -pubout)" == "$(ossl_text x509 -in "$output/mongo.crt" -pubkey -noout)" ]] || fail 'mongo.pem no contiene la clave de mongo.crt.'
  [[ "$(ossl_text x509 -in "$mongo_pem" -fingerprint -sha256 -noout)" == "$(ossl_text x509 -in "$output/mongo.crt" -fingerprint -sha256 -noout)" ]] || fail 'mongo.pem no contiene el certificado mongo.crt.'
else
  cat "$output/mongo.key" "$output/mongo.crt" > "$mongo_pem"
  chmod 600 "$mongo_pem"
fi

truststore="$output/truststore.p12"
if [[ -z "${ACB_TLS_TRUSTSTORE_PASSWORD:-}" ]]; then
  printf 'ACB TLS: falta ACB_TLS_TRUSTSTORE_PASSWORD; truststore.p12 no se creó ni validó.\n' >&2
else
  [[ "${#ACB_TLS_TRUSTSTORE_PASSWORD}" -ge 12 && "$ACB_TLS_TRUSTSTORE_PASSWORD" != *$'\n'* && "$ACB_TLS_TRUSTSTORE_PASSWORD" != *$'\r'* ]] || fail 'ACB_TLS_TRUSTSTORE_PASSWORD debe tener al menos 12 caracteres y ningún control.'
  command -v keytool >/dev/null 2>&1 || fail 'Se requiere keytool para truststore.p12.'
  if [[ ! -f "$truststore" ]]; then
    [[ "$ACB_TLS_TRUSTSTORE_PASSWORD" =~ ^[A-Za-z0-9_-]{12,}$ ]] || fail 'Para crear un truststore nuevo use una contraseña URL-safe.'
    keytool -importcert -trustcacerts -noprompt -alias acb-dev-ca -file "$ca_crt" -keystore "$truststore" -storetype PKCS12 -storepass "$ACB_TLS_TRUSTSTORE_PASSWORD" >/dev/null 2>&1 || fail 'No se pudo crear truststore.p12.'
  fi
  exported="$output/truststore-check.tmp"
  keytool -exportcert -rfc -alias acb-dev-ca -keystore "$truststore" -storetype PKCS12 -storepass "$ACB_TLS_TRUSTSTORE_PASSWORD" -file "$exported" >/dev/null 2>&1 || fail 'No se puede abrir truststore.p12.'
  expected="$(ossl_text x509 -in "$ca_crt" -fingerprint -sha256 -noout)"
  actual="$(ossl_text x509 -in "$exported" -fingerprint -sha256 -noout)"
  rm -f "$exported"
  [[ "$expected" == "$actual" ]] || fail 'El truststore no contiene la CA local actual.'
fi
printf 'Material TLS validado en %s. No se reemplazaron archivos existentes.\n' "$output"
printf 'La confianza del navegador en ca.crt debe configurarse manualmente.\n'
