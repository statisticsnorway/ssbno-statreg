# ssbno-statreg-api
## Description
WIP

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