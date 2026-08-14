# Testing

Both unit tests and integration tests runs in our ci pipeline and shall always pass before merging pull requests.

## Unit tests

All buisness shall be covered by unit tests. We are using vitest for unit testing.

To run tests:

```
npm run test
```

## Integration tests

Patterns to follow. TODO

### Running locally

It's recommended to create a dedicated database for integration tests that can safely be reset between runs:

```sh
createdb statreg_db_integration_test
```

Switch to the dedicated database when working on the integration tests.
This is done by changing `backend/.env`:

```env
PGURL=postgresql://<USERNAME>@localhost:5432/statreg_db_integration_test?sslmode=disable
```

Run the integration tests with the following command:

```sh
cd backend
npx prisma migrate reset && npm run seed && npm run test:integration
```

This will always prompt you before resetting the database.
You may remove the prompt by adding a `--force` flag:

```sh
npx prisma migrate reset --force && npm run seed && npm run test:integration
```
