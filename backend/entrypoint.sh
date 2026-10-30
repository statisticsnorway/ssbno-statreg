openssl pkcs12 -export -out /tmp/pkcs12key.p12 -inkey ${PGSSLKEY} -in ${PGSSLCERT} -passout pass:

export PGURL="postgresql://${PGUSER}@${PGHOST}:${PGPORT}/${PGDATABASE}?sslcert=${PGSSLCERT}&sslidentity=/tmp/pkcs12key.p12"
