# ssbno-statreg-api
## Description
Statreg API is a backend service for statistikkregisteret. It provides endpoints for fetching and managing statistics and publications, amongst other things.

## DEV
```
npm install
npm run build
docker-compose upå
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
## Prerequisites
To get started, you first need to [install Colima and Docker CLI.](https://statistics-norway.atlassian.net/wiki/spaces/mimir/pages/4827381761/Bytte+fra+Docker+Desktop+til+Colima)

## Build and run docker
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

# test with local db
get file schema/statreg.sql - rename docker-compose and sql file to use same user 
npm install
npm run build
docker-compose up -d
npm run dev
http://localhost:8080/statisitcs 


