
### Local dev (with real user token from keycloak)

AUTH_ENABLED can be configured in nodemon.json

```
docker-compose up
docker compose down -v
```

User must variables in .env (required):
```
KEYCLOAK_CLIENT_ID=oauth2-proxy-ssbno-statreg-api
KEYCLOAK_CLIENT_SECRET= (this password is only for devs and stored in gcp secret manager)
KEYCLOAK_WELL_KNOWN_URL=https://auth-play.test.ssb.no/realms/ssb/.well-known/openid-configuration
```

Password stored in GCP: https://console.cloud.google.com/security/secret-manager?project=ssbno-t-lf

Technical Documentation: https://statistics-norway.atlassian.net/wiki/spaces/mimir/pages/5222957098/Local+dev+with+real+user+token+from+keycloak
