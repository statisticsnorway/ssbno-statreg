# ssbno-statreg-api
## Description
Statreg API is a backend service for statistikkregisteret. It provides endpoints for fetching and managing statistics and publications, amongst other things.

## DEV
```
npm install
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

## Build and run
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

PostgreSQL db
drop statreg.sql into schema folder
docker-compose up -d

Check table rows 
docker exec -it statreg-pg psql -U cob -d "statreg-db" -c "
SELECT table_schema, table_name, (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text::bigint AS row_count FROM information_schema.tables WHERE table_schema = 'statreg_data' AND table_type = 'BASE TABLE' ORDER BY table_name;"