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
