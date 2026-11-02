#!/bin/bash
set -eu

: "${PGSSLKEY:?PGSSLKEY must be set}"
: "${PGSSLCERT:?PGSSLCERT must be set}"
: "${PGSSLROOTCERT:?PGSSLROOTCERT must be set}"
: "${PGUSER:?PGUSER must be set}"
: "${PGHOST:?PGHOST must be set}"
: "${PGPORT:?PGPORT must be set}"
: "${PGDATABASE:?PGDATABASE must be set}"

openssl pkcs12 -export -out /tmp/pkcs12key.p12 -inkey "$PGSSLKEY" -in "$PGSSLCERT" -passout pass:

# node-postgres: TLS is configured explicitly in prisma.ts.
export PGURL="postgresql://${PGUSER}@${PGHOST}:${PGPORT}/${PGDATABASE}"

# Prisma CLI: TLS is configured through connection parameters.
export PRISMA_DATABASE_URL="${PGURL}?sslmode=require&sslcert=${PGSSLROOTCERT}&sslidentity=/tmp/pkcs12key.p12&sslaccept=strict"

exec "$@"
