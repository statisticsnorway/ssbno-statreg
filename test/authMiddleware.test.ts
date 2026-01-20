import { test, beforeEach, afterEach, describe, mock } from 'node:test'
import assert from 'node:assert/strict'
import httpMocks, { createResponse, MockResponse } from 'node-mocks-http'

describe('authMiddleWare', async () => {
  const OLD_ENV = { ...process.env }

  afterEach(() => {
    process.env = { ...OLD_ENV }
  })

  describe('unauthorized', async () => {
    test('set correct message and status', async () => {
      const { unauthorized } = await import('../plugins/authMiddleware')

      const response = unauthorized(httpMocks.createResponse(), 'You are unautorized')
      assert.equal(response.statusCode, 401)
      assert.equal((response as any)._getJSONData().error, 'You are unautorized')
      assert.ok((response as any)._isEndCalled())
    })
  })

  describe('forbidden', async () => {
    test('set correct message and status', async () => {
      const { forbidden } = await import('../plugins/authMiddleware')

      const response = forbidden(httpMocks.createResponse(), 'You have no access')
      assert.equal(response.statusCode, 403)
      assert.equal((response as any)._getJSONData().error, 'You have no access')
      assert.ok((response as any)._isEndCalled())
    })
  })

  describe('getBearerToken', async () => {
    test('returns token if given Bearer authorization header', async () => {
      const { getBearerToken } = await import('../plugins/authMiddleware')

      const token = getBearerToken(httpMocks.createRequest({ headers: { authorization: 'Bearer myBearerTokenValue' } }))
      assert.equal(token, 'myBearerTokenValue')
    })

    test('returns null when missing authorization header', async () => {
      const { getBearerToken } = await import('../plugins/authMiddleware')

      const token = getBearerToken(httpMocks.createRequest({ headers: {} }))
      assert.equal(token, null)
    })

    test('returns null when authorization header not starting with "Bearer "', async () => {
      const { getBearerToken } = await import('../plugins/authMiddleware')

      const token = getBearerToken(httpMocks.createRequest({ headers: { authorization: 'myBearerTokenValue' } }))
      assert.equal(token, null)
    })
  })

  describe('hasAudience', async () => {
    test('returns true if token claims has required aud (string)', async () => {
      const { hasAudience } = await import('../plugins/authMiddleware')

      const response = hasAudience({ aud: 'ssbno.developers' }, 'ssbno.developers')
      assert.equal(response, true)
    })

    test('returns true if token claims has required aud (array)', async () => {
      const { hasAudience } = await import('../plugins/authMiddleware')

      const response = hasAudience({ aud: ['ssbno.developers', 'ssb'] }, 'ssbno.developers')
      assert.equal(response, true)
    })

    test('returns false if token claims is missing aud', async () => {
      const { hasAudience } = await import('../plugins/authMiddleware')

      const response = hasAudience({}, 'ssbno.developers')
      assert.equal(response, false)
    })

    test('returns false if token claims is missing required aud', async () => {
      const { hasAudience } = await import('../plugins/authMiddleware')

      const response = hasAudience({ aud: 'ssbno.developers' }, 'ssbno.users')
      assert.equal(response, false)
    })
  })

  describe('keycloakAuth', () => {
    test('returns skipAuth in dev when env vars are missing', async () => {
      process.env.NODE_ENV = 'development'
      process.env.AUTH_ENABLED = 'true'

      delete process.env.KEYCLOAK_PLAY_REALM_ISSUER
      delete process.env.KEYCLOAK_PLAY_JWKS_URI
      delete process.env.KEYCLOAK_PLAY_TOKEN_AUDIENCE

      const { keycloakAuth } = await import('../plugins/authMiddleware')

      const handler = keycloakAuth()
      const req = httpMocks.createRequest()
      const res = createResponse()
      const next = mock.fn()

      await handler(req, res, next as any)

      assert.equal(next.mock.callCount(), 1)
    })

    test('throws in production when env vars are missing', async () => {
      process.env.NODE_ENV = 'production'
      process.env.AUTH_ENABLED = 'true'

      delete process.env.KEYCLOAK_REALM_ISSUER
      delete process.env.KEYCLOAK_JWKS_URI
      delete process.env.KEYCLOAK_TOKEN_AUDIENCE

      const { keycloakAuth } = await import('../plugins/authMiddleware')

      assert.throws(() => keycloakAuth(), /Missing Keycloak OIDC configuration/)
    })
  })

  describe('requireAudience', async () => {
    const REQUIRED = 'ssbno.developers'
    let res: MockResponse<any>
    let next: ReturnType<typeof mock.fn>

    beforeEach(() => {
      res = createResponse()
      next = mock.fn()
    })

    test('bypasses when AUTH_ENABLED=false and calls next()', async () => {
      process.env.AUTH_ENABLED = 'false'

      const { requireAudience } = await import('../plugins/authMiddleware')

      const handler = requireAudience(REQUIRED)
      const req = httpMocks.createRequest()

      await handler(req, res, next as any)

      assert.equal(next.mock.callCount(), 1)
    })

    test('returns 401 when not authenticated', async () => {
      process.env.AUTH_ENABLED = 'true'

      const { requireAudience } = await import('../plugins/authMiddleware')

      const handler = requireAudience(REQUIRED)
      const req = httpMocks.createRequest()

      await handler(req, res, next as any)

      assert.equal(res.statusCode, 401)
      assert.equal(res._getJSONData().error, 'Not authenticated')
      assert.equal(next.mock.callCount(), 0)
    })

    test('returns 403 when audience is missing', async () => {
      process.env.AUTH_ENABLED = 'true'

      const { requireAudience } = await import('../plugins/authMiddleware')

      const handler = requireAudience(REQUIRED)
      const req = httpMocks.createRequest()
      req.auth = { claims: { aud: 'another-api' } }

      await handler(req, res, next as any)

      assert.equal(res.statusCode, 403)
      assert.equal(res._getJSONData().error, 'Insufficient access')
      assert.equal(next.mock.callCount(), 0)
    })

    test('calls next when audience matches', async () => {
      process.env.AUTH_ENABLED = 'true'

      const { requireAudience } = await import('../plugins/authMiddleware')

      const handler = requireAudience(REQUIRED)
      const req = httpMocks.createRequest()
      req.auth = { claims: { aud: REQUIRED } }

      await handler(req, res, next as any)

      assert.equal(next.mock.callCount(), 1)
      assert.equal(res.statusCode, 200)
    })
  })
})
