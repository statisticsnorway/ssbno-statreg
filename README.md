# ssbno-statreg

## Description

Statreg is a fullstack application for statistikkregisteret. It includes an API that provides endpoints for fetching and managing statistics and publications, amongst other things.

## Documentation
Technical documentation are found in [docs](./docs/)-folder

## Getting started with development
### Prerequests before first run

- Install a postgresql database (see [Database docs](./docs/database.md))
- Start the database application and "initialize databases" (or similar)
- Copy the example env configuration file: `cp .env.example .env`
- Fill in placeholder variables and secrets.

As to where to find the secrets see docs for [Authentication and Authorization](./docs/auth.md) and [AD integration](./docs/ad-integration.md).

### First run, database baseline setup

```
npm install
npm run generate
npm run db:deploy
npm run seed
npm run dev
```

### Subsequent application startups

If new migrations: `npm db:deploy`

> NB! Until the first data migration to test database is complete, we don't use migrations. If schema have changed the following sequence _should_ fix your database:
```
npm run generate
npx prisma migrate reset
npx prisma db push
npm run seed
```

For plain local development run:

```
npm run dev
```

Or to run with local authentication flow run docker compose:
```
colima start
docker compose --env-file ./backend/.env up
```

The app is now served on http://localhost:8080

### Local authentication
We are using keycloak for authentication. We have a docker compose setup to simulate production auth flow. 

This setup is documented under [Authentication and authorization](./docs/auth.md).

### Auth override
Set `AUTH_ENABLED=false` in `.env` to bypass auth for local development

## Eslint & Prettier

We use eslint and prettier for type checking and code formatting. To check for linting and formatting errors/warnings run:

```
npm run lint
```

To automatically fix linting and formatting errors/warnings run:

```
npm run lint:fix
```

Keep in mind that not all types of linting/formatting errors and warnings can be fixed automatically.
