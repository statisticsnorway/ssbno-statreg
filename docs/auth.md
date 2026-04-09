# Authentication and authorization

Statreg-api uses [keycloak/wonderwall](https://psychic-broccoli-evke4lm.pages.github.io/how-to/auth-foran-applikasjon/) for authenication, and an auth middleware for authorization. Wonderwall is the part that forces login if not already authenicated in the browser.

There are 3 levels of authorization:
* No authorization (endpoint is open to all). Specified with `skipAuth()` for endpoint in controller.
* Authozied SSB user (default behavior).
* Require admin, specified with `requireAdminAuthorization()` for endpoint in controller. Admin authorization level is granted based on dapla group memberships that are defined in environment variable.

For endpoints with no authorization (`with skipAuth()`), we do not want to force login through wonderwall. Wonderwall exceptions are defined by path in nais yaml using `excludePaths`. Since these exceptions are for path only (not different verbs) for convenience we do exclude entire main paths (ie. `/statistics/** and /releases/**`) for statreg API. Authorization are still enforced for all endpoints through `authMiddleware`. The result of this is that wonderwall will _not_ enforce login for ie. a `PUT` request to `/statistics/:shortname` even if the endpoint is specified with `requireAdminAuthorization()`. However the `authMiddleware` will still validate token and check authorization requirements and in this case return `401`and `Missing bearer token`.

## Local development with working authentication
We have a docker compose setup to simulate production auth flow. Alternatively one can retrieve a valid token for the play keycloak client and pass as authorization header.

### Run locally with authentication flow
In `.env` make sure `AUTH_ENABLED` is set to `true` and that the following variables are defined:

```
KEYCLOAK_CLIENT_ID=oauth2-proxy-ssbno-statreg
KEYCLOAK_CLIENT_SECRET= (this password is only for devs and stored in gcp secret manager)
KEYCLOAK_WELL_KNOWN_URL=https://auth-play.test.ssb.no/realms/ssb/.well-known/openid-configuration
```

Password stored in secret manager in GCP: https://console.cloud.google.com/security/secret-manager (remember that test secret is in test project, and prod secret in prod project)

To run local client:
```
colima start
docker compose up
```
To stop local client: 
```
docker compose down -v
```

### Local Authentication Architecture (Wonderwall + Keycloak PLAY)
When running `npm run dev` the app serves `src/main.ts` directly, with no OAuth2 flow or Bearer token injection. That means all endpoints that require authorization will fail (unless [overriding auth](../README.md#auth-override)). Overriding auth is fine for developing business logic, unit tests ie, but we also need a way to run the app _with_ authentication simulation as well. 

The purpose of this setup is to enable production-equivalent local authentication without changing application auth logic, while keeping npm run dev token-free. This solution simulates NAIS test authentication exact, using the same middleware and token validation.
And keycloak provides the SSO login page if unauthenticated

#### Runtime Components (docker-compose.yaml)
|Component|Responsibility|
|---------|--------------|
|Wonderwall [GitHub - nais/wonderwall: openid connect relying party as a sidecar/service](https://github.com/nais/wonderwall) |OAuth2 client, login redirects, token injection|
|Keycloak PLAY|Identity provider (provides login if needed)|
|Redis|Session store for Wonderwall|
|statreg-api express app|The actual app including token validation + authorization|

#### Authentication Flow (for docker-compose.yaml)
1. Browser sends request to localhost:8080
2. Wonderwall checks cookie: `io.nais.wonderwall.session`
3. If missing or invalid: Redirects to Keycloak PLAY
4. User login
5. Keycloak redirects to: `/oauth2/callback`
6. Wonderwall sets session cookie and stores session in Redis
7. Injects Authorization: Bearer <ID token> and proxies request to statreg-api app. 
8. For all subsequent requests step 4-6 is skipped.
