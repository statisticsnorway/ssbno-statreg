# AGENTS.md — statistikkregisteret (statreg)

Statreg is a fullstack application for statistikkregisteret. It includes an API that provides endpoints for fetching and managing statistics and publications, amongst other things.

This system is a metadata system for registering statistics, their variants (frequency and type of release) and releases belonging to the variants. This data is read by several other internal system and acts as a single-source-of-truth.

## Tech Stack

| Layer    | Technology                                       |
|----------|--------------------------------------------------|
| Backend  | Typescript + Node.js + Express                   |
| Database | PostgreSQL + Prisma                              |
| Frontend | React 19 + TypeScript + Vite                     |
| Build    | Npm + Pkgroll (backend) + Tsc & Vite (frontend)  |
| CI/CD    | GitHub Actions                                   |

## Key Commands

```bash
# Start with local database (only when we want to test auth)
docker compose -f docker-compose.yaml --env-file ./backend/.env up -d

# Start full stack (http://localhost:8080)
npm run dev

# Build API types from the OpenAPI specification (these types are checked in to git)
npm run generate:api-types

# Build Prisma Client
npm run generate

# Run backend tests (required before finishing any task)
npm run test:backend

# Run frontend tests
npm run test:frontend

# Lint (check / fix)
npm run lint
```

## Project Structure

This application is structured as a monorepo. We use the built in NPM workspaces feature to organize dependencies, running the correct commands from top-level etc. We have split the project into FRONTEND - BACKEND - SHARED

Shared: Common files used in both frontend and backend. Here we have OpenAPI specification and Typescript types, enums and useful typing paths making it easier to use the generated API types.

Backend: Node.js application using Express and Prisma for middleware and persistence. This can be viewed as the M and C parts of the MVC pattern. Exposed REST API.

Frontend: React application, consuming the REST API exposed by the backend application. When the application is built, the payload is copied over to the backend dist catalog, so both the frontend and backend runs as a single Express application on the server. This simplifies authentication and hosting.

### Backend - `backend/`
| Path | Purpose |
|------|---------|
|`backend/src/app.ts`| Main entrypoint for the backend application |
|`backend/src/api/core/controllerRouter.ts`| Gathers all the controllers and manages application flow |
|`backend/src/api/controllers/`| Controllers for various API endpoints |
|`backend/src/services/`| Services for accessing database operations. Uses Prisma. |
|`backend/src/lib/`| Shared libraries, used across the backend. |
|`backend/prisma/schema.prisma`| Prisma schema, describing the object model we interact with and how it maps to the Postgres database |
|`backend/prisma/migrations/`| Prisma migrations. NEVER edit these, ONLY EVER create new migrations, using the Prisma tools. DO NOT create migrations directly, only ever using the Prisma tool commands! |


### Frontend — `frontend/`

| Path | Purpose |
|------|---------|
| `components/` | Reusable React components |

## Architecture

Layered: **Controller → Service → Database**

- Controllers are thin — delegate immediately to services, no logic
- Services own all business rules
- Try to avoid duplicate logic using shared libraries

## Testing

- Prefer unit tests. Write integration tests only for complex interactions

## Rules

- Never edit an existing Prisma migration file — always create a new one, and only ever using Prisma tools
- Run backend tests before finishing any backend task
- Never commit directly to `main` — use feature branches and PRs
- Never hardcode credentials, secrets, or SSB-internal identifiers

## Examples

**Add a new endpoint:**
1. Add a query method to the relevant repository
2. Add a service method that calls the repository and maps to a domain model
3. Add a controller method that calls the service and maps to a response model
4. Add the API endpoint to the OpenAPI documentation
5. Build the API types

## Language

- Code, variable names, packages: English
- Comments: Norwegian or English — match the surrounding style.
