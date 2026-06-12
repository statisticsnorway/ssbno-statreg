---
name: prisma-schema-change
description: "Safely handle Prisma schema changes in statreg. Use when editing backend/prisma/schema.prisma, creating migrations, handling migration drift, or regenerating Prisma client. Keywords: prisma, schema, migration, db, database, seed."
argument-hint: "Describe schema change and target models"
---

# Prisma Schema Change

## When To Use
- Editing `backend/prisma/schema.prisma`.
- Creating a new migration.
- Resolving local schema drift.
- Regenerating Prisma client after schema updates.

## Procedure
1. Edit schema in `backend/prisma/schema.prisma`.
2. Regenerate Prisma client from repo root:
   - `npm run generate`
3. Apply migrations in normal flow:
   - `npm run db:deploy`
4. If local setup requires documented recovery workflow, follow repo docs (`README.md` and `docs/database.md`) before continuing.
5. Seed local DB when needed:
   - `npm run seed`
6. Run validation for backend-impacting changes:
   - `npm run test:backend`
7. If the changes are successful and accepted by the user, a migration can be created like this. Remember to replace "${migration-name} with a unique name describing the migration. 
   - `npx prisma migrate dev -n ${migration-name}`

## Guardrails
- Never edit existing files inside `backend/prisma/migrations/`.
- Never handcraft migration history by manually changing old migration SQL.
- Use Prisma tooling for migration creation and application.
- Prefer documented recovery steps over ad-hoc database fixes.

## Done Checklist
- Schema change represented in `schema.prisma`.
- Prisma client regenerated.
- Migration workflow completed with Prisma tooling.
- Existing migration files not modified.
- Backend tests pass.

## Cross-Reference
- Repository-level agent instructions: [agents.md](../../../agents.md)
