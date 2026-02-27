### Database

We use PostgreSQL, provided by Nais in our live environments. Locally you can set up your own Postgres db in one of many ways - install PostgreSQL [from either the website](https://www.postgresql.org/download/), Homebrew or your package manager of choice. If you are on a mac, postgres.app is recommended and makes setup very easy and quick.

### Prisma

We use Prisma both as our ORM and as our schema migration tool in this project. We strongly recommend reading [this article](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project/relational-databases/evolve-your-schema-typescript-postgresql) before touching the schema if you have not used Prisma before.

In short though, Prisma handles schema changes with Migrations, which are incremental change sets applied to the database. Applied migrations are recorded in the database. Migrations are generated with the Prisma CLI, checked into the codebase and _never_ manually changed. After having made changes to your schema, you can push these changes to your local db with `npx prisma db push`. Note that this does not update your migrations, but you can do this as many times as you like until the desired state is achieved. (sidenote: this may cause data loss locally)

When you are happy with your updated schema, you can run `npx prisma migrate dev --name name-of-changeset`. This applies previous changes in schema, generates a new migration with the supplied name, applies all unapplied migrations and triggers generation of a new Prisma Client.

There are many fun pitfalls and ways of messing up both your local db and production data using prisma, so educate yourself, make sure you know what you are doing, and be ready to roll back changes. Locally you can typically run `npx prisma migrate reset` and then `npm run seed` to bring your local database back to a working state.

For local development, we can use a file named ".env" located in the root directory of the project. Currently we only use one environment variable from this file - see prisma.config.ts - and it should look something like this:

```
PGURL="postgresql://<USERNAME>@localhost:5432/statreg_db"
```
