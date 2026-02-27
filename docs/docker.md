
## Docker

### Prerequisites

To get started, you first need to [install Colima and Docker CLI.](https://statistics-norway.atlassian.net/wiki/spaces/mimir/pages/4827381761/Bytte+fra+Docker+Desktop+til+Colima)

### Build and run

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

