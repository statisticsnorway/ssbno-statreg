---
name: endpoint-change
description: "Implement or modify backend API endpoints in statreg. Use when changing controllers, services, repository/data-access, OpenAPI contract, or generated API types. Keywords: endpoint, controller, service, OpenAPI, api-types, backend route."
argument-hint: "Describe endpoint change and affected files"
---

# Endpoint Change

## When To Use
- Adding a new backend endpoint.
- Changing request/response shape for an existing endpoint.
- Updating validation or business logic in endpoint flow.
- Any change touching `backend/src/api/controllers/**`, `backend/src/services/**`, or `shared/openapi/openapi.yaml`.

## Procedure
1. Identify the current flow and keep layering strict: Controller -> Service -> Database.
2. Implement data-access/repository query changes first.
3. Implement service-layer parsing, validation, and business rules.
4. Keep controller logic thin: map HTTP request/response and delegate to service.
5. Update API contract in `shared/openapi/openapi.yaml`.
6. Regenerate shared API types from repo root:
   - `npm run generate:api-types`
7. Update tests in changed areas:
   - backend unit tests for service/controller behavior
   - additional integration tests only when interaction complexity warrants it
8. Run required validation from repo root:
   - `npm run test:backend`
   - `npm run test:frontend` if frontend or shared API consumption changed
   - `npm run lint` for cross-cutting refactors

## Guardrails
- Do not move business logic into controllers.
- Keep OpenAPI and generated types in sync with backend behavior.
- Avoid duplicate logic between backend and frontend when shared code/types can be used.

## Done Checklist
- Endpoint behavior implemented in service layer.
- Controller only maps request/response.
- OpenAPI updated when contract changed.
- `npm run generate:api-types` executed when OpenAPI changed.
- Relevant tests pass.

## Cross-Reference
- Repository-level agent instructions: [agents.md](../../../agents.md)
