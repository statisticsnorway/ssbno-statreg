# ssbno-statreg-api
## Description
Statreg API is a backend service for statistikkregisteret. It provides endpoints for fetching and managing statistics and publications, amongst other things.

## DEV

### Prerequests
* Install a postgresql database (see [Database](#Database))
* Start the database application and "initialize databases" (or similar)
* Create an .env file in repo root and set database connection string on the form:
`NAIS_DATABASE_SSBNO_STATREG_API_STATREG_DB_URL="postgresql://<USERNAME>@localhost:5432/statreg_db"`

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

## Lightship
Abstracts readiness, liveness and startup checks and graceful shutdown of Node.js services running in Kubernetes.
Providing graceful shutdown. Enable `/live` and `/ready` endpoints on port `:9000`.

## Helmet
Help secure Express apps by setting HTTP response headers.

## Prom bundle 
Express middleware with popular prometheus metrics in one bundle. Exposes `/metrics` endpoint.

## Auth switch
set "AUTH_ENABLED": "false" in nodemon.json
to turn of auth for local development

## Docker
### Prerequisites
To get started, you first need to [install Colima and Docker CLI.](https://statistics-norway.atlassian.net/wiki/spaces/mimir/pages/4827381761/Bytte+fra+Docker+Desktop+til+Colima)

### Build and run
Start Colima with the default configuration
```bash
colima start
```

Build the application
```bash
docker build -t ssbno/statreg-api .
```

Then, run
```bash
docker run -it -p 8080:8080 ssbno/statreg-api
```

## Persistence

### Database

We use PostgreSQL, provided by Nais in our live environments. Locally you can set up your own Postgres db in one of many ways - install PostgreSQL [from either the website](https://www.postgresql.org/download/), Homebrew or your package manager of choice. If you are on a mac, postgres.app is recommended and makes setup very easy and quick. 

### Prisma

We use Prisma both as our ORM and as our schema migration tool in this project. We strongly recommend reading [this article](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project/relational-databases/evolve-your-schema-typescript-postgresql) before touching the schema if you have not used Prisma before.

In short though, Prisma handles schema changes with Migrations, which are incremental change sets applied to the database. Applied migrations are recorded in the database. Migrations are generated with the Prisma CLI, checked into the codebase and _never_ manually changed. After having made changes to your schema, you can push these changes to your local db with `npx prisma db push`. Note that this does not update your migrations, but you can do this as many times as you like until the desired state is achieved. (sidenote: this may cause data loss locally)

When you are happy with your updated schema, you can run `npx prisma migrate dev --name name-of-changeset`. This applies previous changes in schema, generates a new migration with the supplied name, applies all unapplied migrations and triggers generation of a new Prisma Client.

There are many fun pitfalls and ways of messing up both your local db and production data using prisma, so educate yourself, make sure you know what you are doing, and be ready to roll back changes. Locally you can typically run `npx prisma migrate reset` and then `npm run seed` to bring your local database back to a working state.

For local development, we can use a file named ".env" located in the root directory of the project. Currently we only use one environment variable from this file - see prisma.config.ts - and it should look something like this:  
`NAIS_DATABASE_MYAPP_MYDB_URL="postgresql://<USERNAME>@localhost:5432/statreg_db"`

### Entra Reader 
Connecteds to Azure entra ID via a new app resource that uses Oauth to authenticate
We are able to read user info and get back, name and phone number and email, via endpoint for human and nonhuman users 
the endpoint supports both full email or just email initals.
Works based on provision of:
ENTRA_READER_AZURE_TENANT_ID
ENTRA_READER_AZURE_CLIENT_ID
ENTRA_READER_AZURE_CLIENT_SECRET - stored in https://console.cloud.google.com/security/secret-manager/secret/ENTRA_READER_AZURE_CLIENT_SECRET/versions?project=ssbno-t-lf
The other variables can be found here - https://portal.azure.com/?l=en.en-us#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/f20f3383-d147-4039-a95b-6370cc94723b/isMSAApp~/false
Single or multiple users:
GET /entra/users/iii
GET /entra/users/iii,yyy,stud-uuu
capped at 20 users per call, based on microsoft graph internal limits
in test and production the variables will be supplied trough nais secret manager (envFrom - secret: statreg-api-secrets)