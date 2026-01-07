set -e

# Generate p12-file for ssl, see prisma docs: https://www.prisma.io/docs/orm/overview/databases/postgresql#configuring-an-ssl-connection
# example: openssl pkcs12 -export -out client-identity.p12 -inkey client-key.pem -in client-cert.pem
openssl pkcs12 -password pass:$SSBNO_STATREG_API_SSL_PASSWORD -export -out /tmp/client-identity.p12 -inkey $NAIS_DATABASE_SSBNO_STATREG_API_STATREG_DB_SSLKEY -in $NAIS_DATABASE_SSBNO_STATREG_API_STATREG_DB_SSLCERT

# Building connection string from scratch
# example: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslidentity=client-identity.p12&sslpassword=mypassword&sslcert=rootca.cert
STATREG_DB_URL_CONNECTION_STRING="postgresql://$NAIS_DATABASE_SSBNO_STATREG_API_STATREG_DB_USERNAME:$NAIS_DATABASE_SSBNO_STATREG_API_STATREG_DB_PASSWORD@$NAIS_DATABASE_SSBNO_STATREG_API_STATREG_DB_HOST:$NAIS_DATABASE_SSBNO_STATREG_API_STATREG_DB_PORT/$NAIS_DATABASE_SSBNO_STATREG_API_STATREG_DB_DATABASE?sslidentity=/tmp/client-identity.p12&sslpassword=$SSBNO_STATREG_API_SSL_PASSWORD&sslcert=$NAIS_DATABASE_SSBNO_STATREG_API_STATREG_DB_SSLROOTCERT"

npm run db:deploy
exec npm run start
