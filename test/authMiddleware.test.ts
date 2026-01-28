import { test, beforeEach, afterEach, describe, mock } from 'node:test'
import assert from 'node:assert/strict'
import httpMocks, { createResponse, MockResponse } from 'node-mocks-http'

describe('authMiddleWare', () => {
  const OLD_ENV = { ...process.env }

  afterEach(() => {
    process.env = { ...OLD_ENV }
  })

  describe('unauthorized', () => {
    test('set correct message and status', async () => {
      const { unauthorized } = await import('../plugins/authMiddleware')

      const response = unauthorized(httpMocks.createResponse(), 'You are unautorized')
      assert.equal(response.statusCode, 401)
      assert.equal((response as any)._getJSONData().error, 'You are unautorized')
      assert.ok((response as any)._isEndCalled())
    })
  })

  describe('forbidden', () => {
    test('set correct message and status', async () => {
      const { forbidden } = await import('../plugins/authMiddleware')

      const response = forbidden(httpMocks.createResponse(), 'You have no access')
      assert.equal(response.statusCode, 403)
      assert.equal((response as any)._getJSONData().error, 'You have no access')
      assert.ok((response as any)._isEndCalled())
    })
  })

  describe('getBearerToken', () => {
    test('returns token if given Bearer authorization header', async () => {
      const { getBearerToken } = await import('../plugins/authMiddleware')

      const token = getBearerToken(
        httpMocks.createRequest({
          headers: { authorization: 'Bearer myBearerTokenValue' },
        })
      )

      assert.equal(token, 'myBearerTokenValue')
    })

    test('returns null when missing authorization header', async () => {
      const { getBearerToken } = await import('../plugins/authMiddleware')

      const token = getBearerToken(httpMocks.createRequest())
      assert.equal(token, null)
    })

    test('returns null when authorization header not starting with "Bearer "', async () => {
      const { getBearerToken } = await import('../plugins/authMiddleware')

      const token = getBearerToken(
        httpMocks.createRequest({
          headers: { authorization: 'myBearerTokenValue' },
        })
      )

      assert.equal(token, null)
    })
  })

  describe('keycloakAuth', () => {
    test('throws when AUTH_ENABLED=true and dev env vars are missing', async () => {
      delete process.env.KEYCLOAK_PLAY_REALM_ISSUER
      delete process.env.KEYCLOAK_PLAY_JWKS_URI
      delete process.env.KEYCLOAK_PLAY_TOKEN_AUDIENCE

      const { keycloakAuth } = await import('../plugins/authMiddleware')

      assert.throws(() => keycloakAuth(), /Keycloak configuration is missing/)
    })

    test('throws when AUTH_ENABLED=true and prod env vars are missing', async () => {
      process.env.NODE_ENV = 'production'
      process.env.AUTH_ENABLED = 'true'

      delete process.env.KEYCLOAK_REALM_ISSUER
      delete process.env.KEYCLOAK_JWKS_URI
      delete process.env.KEYCLOAK_TOKEN_AUDIENCE

      const { keycloakAuth } = await import('../plugins/authMiddleware')

      assert.throws(() => keycloakAuth(), /Keycloak configuration is missing/)
    })
  })

  describe('requireUserGroupAuthorization', () => {
    const REQUIRED_GROUP = 'ssbno-developers'
    let res: MockResponse<any>
    let next: ReturnType<typeof mock.fn>

    beforeEach(() => {
      res = createResponse()
      next = mock.fn()
    })

    test('bypasses when AUTH_ENABLED=false and calls next()', async () => {
      process.env.AUTH_ENABLED = 'false'

      const { requireUserGroupAuthorization } = await import('../plugins/authMiddleware')

      const handler = requireUserGroupAuthorization(REQUIRED_GROUP)
      const req = httpMocks.createRequest()

      await handler(req, res, next as any)

      assert.equal(next.mock.callCount(), 1)
    })

    test('returns 401 when not authenticated', async () => {
      process.env.AUTH_ENABLED = 'true'

      const { requireUserGroupAuthorization } = await import('../plugins/authMiddleware')

      const handler = requireUserGroupAuthorization(REQUIRED_GROUP)
      const req = httpMocks.createRequest()

      await handler(req, res, next as any)

      assert.equal(res.statusCode, 401)
      assert.equal(res._getJSONData().error, 'Not authenticated')
      assert.equal(next.mock.callCount(), 0)
    })

    test('returns 403 when dapla.groups is missing', async () => {
      process.env.AUTH_ENABLED = 'true'

      const { requireUserGroupAuthorization } = await import('../plugins/authMiddleware')

      const handler = requireUserGroupAuthorization(REQUIRED_GROUP)
      const req = httpMocks.createRequest()
      req.auth = { claims: {} }

      await handler(req, res, next as any)

      assert.equal(res.statusCode, 403)
      assert.equal(res._getJSONData().error, 'Missing authorization groups')
      assert.equal(next.mock.callCount(), 0)
    })

    test('returns 403 when required group is not present', async () => {
      process.env.AUTH_ENABLED = 'true'

      const { requireUserGroupAuthorization } = await import('../plugins/authMiddleware')

      const handler = requireUserGroupAuthorization(REQUIRED_GROUP)
      const req = httpMocks.createRequest()

      req.auth = {
        claims: {
          dapla: {
            groups: ['other-group'],
          },
        },
      }

      await handler(req, res, next as any)

      assert.equal(res.statusCode, 403)
      assert.equal(res._getJSONData().error, 'Insufficient access')
      assert.equal(next.mock.callCount(), 0)
    })

    test('calls next when required group exists', async () => {
      process.env.AUTH_ENABLED = 'true'

      const { requireUserGroupAuthorization } = await import('../plugins/authMiddleware')

      const handler = requireUserGroupAuthorization(REQUIRED_GROUP)
      const req = httpMocks.createRequest()

      req.auth = {
        claims: {
          dapla: {
            groups: ['ssbno-developers', 'another-group'],
          },
        },
      }

      await handler(req, res, next as any)

      assert.equal(next.mock.callCount(), 1)
      assert.equal(res.statusCode, 200)
    })
  })

  describe('createKeycloakAuthMiddleware', () => {
    test('returns 401 when bearer token is missing', async () => {
      const { createKeycloakAuthMiddleware } = await import('../plugins/authMiddleware')

      const handler = createKeycloakAuthMiddleware('issuer', 'https://jwks', 'audience')

      const req = httpMocks.createRequest()
      const res = httpMocks.createResponse()
      const next = () => {}

      await handler(req, res, next)

      assert.equal(res.statusCode, 401)
      assert.equal(res._getJSONData().error, 'Missing Bearer token')
    })
  })
})
