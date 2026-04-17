# Testing

Both unit tests and integration tests runs in our ci pipeline and shall always pass before merging pull requests.

## Unit tests

All buisness shall be covered by unit tests. We are using vitest for unit testing.

To run tests:
```
npm run test
```

## Integration tests

### Running locally

Test against running instance (e.g. after running `npm run dev`):

```bash
npm run test:integration
```

This runs fast, but modifies the local database instance.

Test in a Docker container:

```bash
docker-compose -f docker-compose-test.yaml up --abort-on-container-exit --exit-code-from tests
```

This takes a while, but rebuilds a fresh database and application on every run.
