# Middlewares used in statreg api

## Lightship

Abstracts readiness, liveness and startup checks and graceful shutdown of Node.js services running in Kubernetes.
Providing graceful shutdown. Enable `/live` and `/ready` endpoints on port `:9000`.

## Helmet

Help secure Express apps by setting HTTP response headers.

## Prom bundle

Express middleware with popular prometheus metrics in one bundle. Exposes `/metrics` endpoint.

## Auth middleware

Middleware to automatically handle authentication and authorization. Read more in [Authentication and authorization](auth.md).

## Prisma middleware

We interrupt Prisma create, update and delete calls to write auditLog entries. This happens in the common Prisma client definition, and as long as you import the extended types it should not interfere with operation. CreateMany, updateMany and similar calls are disabled project wide. Remember to keep the list of extended types updated to ensure new versions are logged.
