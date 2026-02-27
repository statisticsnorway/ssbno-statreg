# ssbno-statreg-api

## Description

Statreg API is a backend service for statistikkregisteret. It provides endpoints for fetching and managing statistics and publications, amongst other things.

## DEV
### Prerequests

- Install a postgresql database (see [Database](#Database))
- Start the database application and "initialize databases" (or similar)
- Copy the example env configuration file and fill in the secrets:

```
cp .env.example .env
```

As to where to find the secrets go to [Local dev with keycloak](#local-dev-with-real-user-token-from-keycloak) and [Entra Reader](#entra-reader) for more information.

### First run, database baseline setup

```
npm install
npm db:deploy
npm run seed
npm run dev
```

### Subsequent application startups

If new migrations: `npm db:deploy`

Then run

```
npm run dev
```

Go to http://localhost:8080 to see results.

## Eslint & Prettier

To check for linting and formatting errors/warnings run:

```
npm run lint
```

To automatically fix linting and formatting errors/warnings run:

```
npm run lint:fix
```

Keep in mind that not all types of linting/formatting errors and warnings can be fixed automatically.


## Auth switch

set `"AUTH_ENABLED": "false"` in nodemon.json
to turn of auth for local development
