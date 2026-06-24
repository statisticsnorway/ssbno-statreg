---
name: change-to-validation
description: "Select required validation commands from changed files in statreg monorepo. Use before finishing a task or PR. Keywords: validation, test matrix, required checks, changed files, done criteria."
argument-hint: "List changed paths to compute required checks"
---

# Change To Validation

## When To Use
- Before finalizing implementation.
- When preparing commits or pull requests.
- When uncertain which tests/lint are required for the changed scope.

## Validation Matrix
- If `backend/**` changed:
  - Run `npm run test:backend`
- If `frontend/**` changed:
  - Run `npm run test:frontend`
- If `shared/**` changed:
  - Run `npm run test`
- If `shared/openapi/openapi.yaml` changed:
  - Run `npm run generate:api-types`
  - Then run relevant tests (at minimum backend/frontend where affected)
- If `backend/prisma/schema.prisma` changed:
  - Run `npm run generate`
  - Follow Prisma workflow from docs
  - Run `npm run test:backend`
- If changes are cross-cutting refactors across multiple packages:
  - Run `npm run test`
  - Run `npm run lint`
- If changes are complex, or if libraries are touched
  - Run `npm run test:integration:docker`
  - Or, if Docker is not present, run the application in one process and in a separate process:
  - Run  `npm run test:integration`

## Procedure
1. Enumerate changed file paths.
2. Apply matrix rules and union all required commands.
3. Execute required commands from repo root.
4. If failures are unrelated pre-existing issues, report clearly and do not mask them.
5. Only conclude work after required checks are green or failures are explicitly documented.

## Output Format
When reporting validation status, include:
- Which matrix rules were triggered.
- Commands run.
- Pass/fail summary per command.
- Any unresolved blockers.

## Cross-Reference
- Repository-level agent instructions: [agents.md](../../../agents.md)
