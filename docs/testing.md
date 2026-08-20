# Testing

Both unit tests and integration tests runs in our ci pipeline and shall always pass before merging pull requests.

## Unit tests

All buisness shall be covered by unit tests. We are using vitest for unit testing.

To run tests:

```
pnpm run test
```

## Integration tests

We don't clean up the database after each integration test.
It's better to assume that data will change while they run, as this forces us to write more robust tests that aren't tightly coupled to seed data.
And we can verify that endpoints that should be idempotent actually are.

In practice, each test should primarly depend on database resources it creates itself.
For instance, if we want to test updating a statistic, we first post a statistic only for that test.
It is also useful to test that a sequence of API calls work as expected.

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
pnpm run test:integration:local
```

This will always prompt you before resetting the database.
If you want to run it without the prompt:

```sh
pnpm run test:integration:local:force
```
