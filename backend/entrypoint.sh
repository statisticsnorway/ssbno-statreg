#!/bin/bash
set -eu

: "${PGSSLKEY:?PGSSLKEY must be set}"
: "${PGSSLCERT:?PGSSLCERT must be set}"
: "${PGUSER:?PGUSER must be set}"
: "${PGHOST:?PGHOST must be set}"
: "${PGPORT:?PGPORT must be set}"
: "${PGDATABASE:?PGDATABASE must be set}"

openssl pkcs12 -export -out /tmp/pkcs12key.p12 -inkey "$PGSSLKEY" -in "$PGSSLCERT" -passout pass:

export PGURL="postgresql://${PGUSER}@${PGHOST}:${PGPORT}/${PGDATABASE}?sslcert=${PGSSLCERT}&sslidentity=/tmp/pkcs12key.p12&sslaccept=accept_invalid_certs"

exec "$@"
