# AGENTS.md - statistikkregisteret (statreg)

This file contains repo-specific instructions for coding agents working in this monorepo.
When there is a conflict between generic guidance and this file, follow this file.

## Purpose

Statreg is a fullstack metadata system for statistikregisteret.
It manages statistics, variants, and publication releases, and serves as a source of truth for other internal systems.

## Stack

| Layer | Technology |
|------|------|
| Backend | TypeScript, Node.js, Express |
| Database | PostgreSQL, Prisma |
| Frontend | React 19, TypeScript, Vite |
| Build | NPM workspaces, Pkgroll (backend), TSC and Vite (frontend) |
| CI | GitHub Actions |

## Monorepo Layout

- `backend/`: API, services, Prisma schema and migrations
- `frontend/`: React application
- `shared/`: OpenAPI spec and shared types consumed by backend and frontend

## Core Architecture Rules

- Use layered flow: Controller -> Service -> Database.
- Keep controllers thin; put business logic in services.
- Reuse shared libraries instead of duplicating logic.
- Keep API contract changes synchronized with OpenAPI and generated API types.

## Commands

Use these commands from repo root.

```bash
# Start full stack (http://localhost:8080)
npm run dev

# Start local auth flow (Keycloak + app)
npm run dev:auth

# Build Prisma client
npm run generate

# Generate shared API types from OpenAPI
npm run generate:api-types

# Apply migrations
npm run db:deploy

# Seed local database
npm run seed

# Tests
npm run test
npm run test:backend
npm run test:frontend
npm run test:integration

# Lint
npm run lint
npm run lint:fix
```

## Change-Type Playbook

Run the minimum required checks for the files you changed.

| If you changed | Required validation before finishing |
|------|------|
| `backend/**` | `npm run test:backend` |
| `frontend/**` | `npm run test:frontend` |
| `shared/**` | `npm run test` and `npm run test:frontend` and `npm run test:backend` |
| `shared/openapi/openapi.yaml` | `npm run generate:api-types` and then relevant tests |
| `backend/prisma/schema.prisma` | `npm run generate`, apply Prisma workflow from docs, then backend tests |
| Cross-cutting refactors | `npm run test` and `npm run lint` |

## Prisma And Database Safety

- Never edit an existing migration inside `backend/prisma/migrations/`.
- Create new migrations using Prisma tooling only.
- Follow `docs/database.md` and `README.md` for current local migration workflow.
- If local schema drifts, prefer documented recovery steps over manual migration edits.

## TypeScript Rules

- Frontend `tsconfig` uses `erasableSyntaxOnly`.
- Do not introduce TypeScript `enum` in frontend code.
- Use JS-compatible enum pattern: const object + union type.

## Testing And Quality Expectations

- Prefer unit tests; add integration tests for complex interactions.
- When changing behavior, update or add tests in the same area.
- Run lint and relevant tests before concluding work.

## Security And Data Handling

- Never hardcode credentials, tokens, secrets, or internal identifiers.
- Do not log sensitive values.
- Preserve auth behavior unless explicitly requested to change it.

## Endpoint Change Checklist

When adding or changing backend endpoints:

1. Update repository/data-access query.
2. Add or update service logic and validation.
3. Keep controller focused on request/response mapping.
4. Update OpenAPI spec in `shared/openapi/openapi.yaml`.
5. Run `npm run generate:api-types`.
6. Add or update backend tests.

## Language Conventions

- Code, symbols, and package names: English.
- Comments: Norwegian or English, match surrounding style.

## Useful References

- `README.md`
- `docs/coding.md`
- `docs/testing.md`
- `docs/database.md`
- `docs/auth.md`

## Skills Available

Use these repo skills in chat with `/` commands, or rely on auto-invocation when relevant.

### `change-to-validation`

- Use when deciding which required checks to run from changed files before finishing work.
- Covers validation mapping for backend, frontend, shared, OpenAPI, Prisma schema, and cross-cutting refactors.
- File: `.github/skills/change-to-validation/SKILL.md`

### `endpoint-change`

- Use when adding or modifying backend endpoints.
- Covers Controller -> Service -> Database layering, OpenAPI sync, API type generation, and endpoint-focused test expectations.
- File: `.github/skills/endpoint-change/SKILL.md`

### `prisma-schema-change`

- Use when editing `backend/prisma/schema.prisma` or handling migrations.
- Covers safe Prisma workflow, client regeneration, migration guardrails, and backend validation expectations.
- File: `.github/skills/prisma-schema-change/SKILL.md`

## Skill Usage Tips

- Be specific in prompt wording to improve skill matching (for example: "update endpoint contract", "prisma schema change", "what validation commands are required").
- Keep skill files updated when scripts or workflows change.
- Prefer focused skills over one large generic skill.
