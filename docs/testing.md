# Testing

## Integration tests

### Running locally

Test against running instance (e.g. after running `npm run dev`):

```bash
npm run test:interation
```

Test in a Docker container:

```bash
docker-compose -f docker-compose-test.yaml up --abort-on-container-exit --exit-code-from tests
```

This will rebuild the app in a Docker container and run the integration tests.
