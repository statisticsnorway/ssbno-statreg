# ssbno-statreg-api
## Description
Statreg API is a backend service for statistikkregisteret. It provides endpoints for fetching and managing statistics and publications, amongst other things.

## DEV

### First run, database baseline setup
```
npm install
npm run generate
npx prisma db push
npm run seed
npm run dev
```

### Subsequent application startups
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
