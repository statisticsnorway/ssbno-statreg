import { test, beforeEach, afterEach, describe, mock } from 'node:test'
import assert from 'node:assert/strict'
import httpMocks, { createResponse, MockResponse } from 'node-mocks-http'
import {
  unauthorized,
  forbidden,
  getBearerToken,
  hasAudience,
  keycloakJwtAuth,
  requireAudience,
  makeKeycloakJwtAuth,
  VerifyJwt,
} from '../plugins/authMiddleware'
import { JWTPayload } from 'jose'

// let fetchMock: ReturnType<typeof mock.method>
// let errorMock: ReturnType<typeof mock.method>
// let payload: object // using object instead of KlassClassification to test invalid/partial payloads

beforeEach(() => {
  // delete process.env.DATA_BASE_URL
})

afterEach(() => {})

describe('authMiddleWare ', async () => {
  describe('unauthorized ', async () => {
    test('set correct message and status', async () => {
      const response = unauthorized(httpMocks.createResponse(), 'You are unautorized')
      assert.equal(response.statusCode, 401)
      assert.equal((response as any)._getJSONData().error, 'You are unautorized')
      assert.ok((response as any)._isEndCalled())
    })
  })

  describe('forbidden ', async () => {
    test('set correct message and status', async () => {
      const response = forbidden(httpMocks.createResponse(), 'You have no access')
      assert.equal(response.statusCode, 403)
      assert.equal((response as any)._getJSONData().error, 'You have no access')
      assert.ok((response as any)._isEndCalled())
    })
  })

  describe('getBearerToken ', async () => {
    test('returns token if given Bearer authorization header', async () => {
      const token = getBearerToken(httpMocks.createRequest({ headers: { authorization: 'Bearer myBearerTokenValue' } }))
      assert.equal(token, 'myBearerTokenValue')
    })
    // TODO: Fix code so this test passes
    // test('returns token if for case-insensitively bearer', async () => {
    //   const token = getBearerToken(httpMocks.createRequest({ headers: { authorization: 'bearer myBearerTokenValue' } }))
    //   assert.equal(token, 'myBearerTokenValue')
    // })
    test('returns null when missing authorization header', async () => {
      const token = getBearerToken(httpMocks.createRequest({ headers: {} }))
      assert.equal(token, null)
    })
    test('returns null when authorization header not starting with "Bearer "', async () => {
      const token = getBearerToken(httpMocks.createRequest({ headers: { authorization: 'myBearerTokenValue' } }))
      assert.equal(token, null)
    })
  })

  describe('hasAudience ', async () => {
    test('returns true if token claims has required aud and aud is a string', async () => {
      const response = hasAudience({ aud: 'ssbno.developers' }, 'ssbno.developers')
      assert.equal(response, true)
    })
    test('returns true if token claims has required aud and aud is an array', async () => {
      const response = hasAudience({ aud: ['ssbno.developers', 'ssb'] }, 'ssbno.developers')
      assert.equal(response, true)
    })
    test('returns false if token claims is missing aud', async () => {
      const response = hasAudience({}, 'ssbno.developers')
      assert.equal(response, false)
    })
    test('returns false if token claims is missing required aud', async () => {
      const response = hasAudience({ aud: 'ssbno.developers' }, 'ssbno.users')
      assert.equal(response, false)
    })
    test('returns false if token claims is missing required aud and aud is an array', async () => {
      const response = hasAudience({ aud: ['ssbno.developers', 'ssb'] }, 'ssbno.users')
      assert.equal(response, false)
    })
    test('returns false if required aud is only a substring of aud from token claims', async () => {
      const response = hasAudience({ aud: 'ssbno.developers' }, 'ssbno')
      assert.equal(response, false)
    })
    test('returns false if required aud is only a substring of aud from token claims and aud is an array', async () => {
      const response = hasAudience({ aud: ['ssbno.developers', 'ssbno.users'] }, 'ssbno')
      assert.equal(response, false)
    })
  })

  describe('makeKeycloakJwtAuth ', () => {
    let res: MockResponse<any>
    let next: ReturnType<typeof mock.fn>

    beforeEach(() => {
      res = createResponse()
      next = mock.fn()
    })

    test('returns 401 when missing Bearer token', async () => {
      const verify = mock.fn(async () => {
        throw new Error('should not be called')
      })
      const handler = makeKeycloakJwtAuth(verify)
      const req = httpMocks.createRequest()
      await handler(req, res, next as any)

      assert.equal(res.statusCode, 401)
      assert.equal(res.body?.message, 'Missing Bearer token')
      assert.equal(next.mock.callCount(), 0)
      assert.equal(verify.mock.callCount(), 0)
    })

    test('returns 401 when verification fails', async () => {
      const verify = mock.fn(async () => {
        throw new Error('bad token')
      })
      const handler = makeKeycloakJwtAuth(verify)
      const req = httpMocks.createRequest({ authorization: 'Bearer tok' })
      await handler(req, res, next as any)

      assert.equal(res.statusCode, 401)
      assert.equal(res.body?.message, 'Invalid or expired token')
      assert.equal(next.mock.callCount(), 0)
      assert.equal(verify.mock.callCount(), 1)
    })

    test('sets req.auth and calls next when verification succeeds', async () => {
      const payload: JWTPayload = {
        preferred_username: 'anne',
        email: 'anne@example.com',
        sub: '123',
        aud: 'my-api',
        iss: 'https://issuer',
      }
      const verify = mock.fn(async () => payload)
      const handler = makeKeycloakJwtAuth(verify)
      const req = httpMocks.createRequest({ authorization: 'Bearer good' })

      await handler(req, res, next as any)

      // @ts-ignore
      assert.deepEqual(req.auth?.claims, payload)
      // @ts-ignore
      assert.equal(req.auth?.username, 'anne')
      // @ts-ignore
      assert.equal(req.auth?.email, 'anne@example.com')

      assert.equal((next as any).mock.callCount(), 1)
      assert.equal(res.statusCode, undefined)
    })

    test('omits username/email if not strings', async () => {
      const payload: JWTPayload = {
        preferred_username: 99 as any,
        email: { foo: 'bar' } as any,
      }
      const verify = mock.fn(async () => payload)
      const handler = makeKeycloakJwtAuth(verify)
      const req = httpMocks.createRequest({ authorization: 'Bearer t' })

      await handler(req, res, next)

      // @ts-ignore
      assert.deepEqual(req.auth?.claims, payload)
      // @ts-ignore
      assert.equal(req.auth?.username, undefined)
      // @ts-ignore
      assert.equal(req.auth?.email, undefined)
    })
  })

  describe('keycloakJwtAuthFromEnv (wiring)', () => {
    const OLD = { ...process.env }

    test('throws if env variables are missing', () => {
      process.env = {}
      assert.throws(() => keycloakJwtAuth(), /Missing Keycloak OIDC configuration/)
    })

    test('returns a handler when env variables are set', () => {
      process.env = {
        ...OLD,
        KEYCLOAK_REALM_ISSUER: 'https://issuer',
        KEYCLOAK_JWKS_URI: 'https://issuer/protocol/openid-connect/certs',
        KEYCLOAK_TOKEN_AUDIENCE: 'my-api',
      }
      const handler = keycloakJwtAuth()
      assert.equal(typeof handler, 'function')
      process.env = OLD
    })
  })

  // describe('requireAudience ', async () => {
  //   //TODO: add tests for requireAudience
  //   test('set correct message and status', async () => {
  //     const response = unauthorized(httpMocks.createResponse(), 'You are unautorized')
  //     assert.equal(response.statusCode, 401)
  //     assert.equal((response as any)._getJSONData().error, 'You are unautorized')
  //     assert.ok((response as any)._isEndCalled())
  //   })

  //   test('returns next() without correct audiance if AUTH_ENABLED is false', async () => {
  //     process.env.AUTH_ENABLED = 'false'
  //     const handler = requireAudience('ssbno.developers')
  //     assert.equal(handler, 401)
  //   })
  // })
})

////////////// MOCK DATA ////////////////////////////////
