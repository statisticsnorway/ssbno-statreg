/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
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
      expect(response.statusCode).toBe(401)
      expect((response as any)._getJSONData().message).toBe('You are unautorized')
      expect((response as any)._isEndCalled()).toBeTruthy()
    })
  })

  describe('forbidden', () => {
    test('set correct message and status', async () => {
      const { forbidden } = await import('../plugins/authMiddleware')

      const response = forbidden(httpMocks.createResponse(), 'You have no access')
      expect(response.statusCode).toBe(403)
      expect((response as any)._getJSONData().message).toBe('You have no access')
      expect((response as any)._isEndCalled()).toBeTruthy()
    })

    describe('getBearerToken', () => {
      test('returns token if given Bearer authorization header', async () => {
        const { getBearerToken } = await import('../plugins/authMiddleware')

        const token = getBearerToken(
          httpMocks.createRequest({
            headers: { authorization: 'Bearer myBearerTokenValue' },
          })
        )

        expect(token).toStrictEqual('myBearerTokenValue')
      })
      test('returns token if given Bearer authorization header, and check for case insentitivity and extra whitespaces', async () => {
        const { getBearerToken } = await import('../plugins/authMiddleware')

        const token = getBearerToken(
          httpMocks.createRequest({ headers: { AUthorization: 'beareR  myBearerTokenValue' } })
        )
        expect(token).toStrictEqual('myBearerTokenValue')
      })
      test('returns null when missing authorization header', async () => {
        const { getBearerToken } = await import('../plugins/authMiddleware')

        const token = getBearerToken(httpMocks.createRequest())
        expect(token).toBeNull()
      })
      test('returns null when authorization header not starting with "Bearer " (including one or more whitespace)', async () => {
        const { getBearerToken } = await import('../plugins/authMiddleware')

        const token = getBearerToken(
          httpMocks.createRequest({ headers: { authorization: 'bearermyBearerTokenValue' } })
        )
        expect(token).toBeNull()
      })
    })

    describe('isAdmin', () => {
      test('returns true when one configured admin group is present', async () => {
        process.env.ADMIN_GROUPS = 'ssbno-developers, desk'

        const { isAdmin } = await import('../plugins/authMiddleware')

        const result = isAdmin({
          dapla: {
            groups: ['other-group', 'desk'],
          },
        } as any)

        expect(result).toBe(true)
      })

      test('returns false when no configured admin group is present', async () => {
        process.env.ADMIN_GROUPS = 'ssbno-developers,desk'

        const { isAdmin } = await import('../plugins/authMiddleware')

        const result = isAdmin({
          dapla: {
            groups: ['other-group'],
          },
        } as any)

        expect(result).toBe(false)
      })

      test('returns false when dapla.groups is missing', async () => {
        process.env.ADMIN_GROUPS = 'ssbno-developers'

        const { isAdmin } = await import('../plugins/authMiddleware')

        expect(isAdmin({})).toBe(false)
      })

      test('returns false when ADMIN_GROUPS is missing', async () => {
        delete process.env.ADMIN_GROUPS

        const { isAdmin } = await import('../plugins/authMiddleware')

        const result = isAdmin({
          dapla: {
            groups: ['ssbno-developers'],
          },
        } as any)

        expect(result).toBe(false)
      })
    })

    describe('skipAuth', () => {
      test('sets isAdmin true in request context when AUTH_ENABLED=false', async () => {
        process.env.AUTH_ENABLED = 'false'

        const { skipAuth } = await import('../plugins/authMiddleware')
        const { asyncLocalStorage } = await import('../src/lib/context')

        const req = httpMocks.createRequest()
        const res = httpMocks.createResponse()

        let isAdminInContext: boolean | undefined

        const next = vi.fn(() => {
          isAdminInContext = asyncLocalStorage.getStore()?.isAdmin
        })

        await skipAuth(req, res, next)

        expect(next).toHaveBeenCalledOnce()
        expect(isAdminInContext).toBe(true)
      })

      test('sets isAdmin false in request context when AUTH_ENABLED=true', async () => {
        process.env.AUTH_ENABLED = 'true'

        const { skipAuth } = await import('../plugins/authMiddleware')
        const { asyncLocalStorage } = await import('../src/lib/context')

        const req = httpMocks.createRequest()
        const res = httpMocks.createResponse()

        let isAdminInContext: boolean | undefined

        const next = vi.fn(() => {
          isAdminInContext = asyncLocalStorage.getStore()?.isAdmin
        })

        await skipAuth(req, res, next)

        expect(next).toHaveBeenCalledOnce()
        expect(isAdminInContext).toBe(false)
      })
    })

    describe('keycloakAuth', () => {
      test('throws when AUTH_ENABLED=true and dev env vars are missing', async () => {
        delete process.env.KEYCLOAK_REALM_ISSUER
        delete process.env.KEYCLOAK_JWKS_URI
        delete process.env.KEYCLOAK_TOKEN_AUDIENCE

        const { keycloakAuth } = await import('../plugins/authMiddleware')

        expect(() => keycloakAuth()).toThrow(/Keycloak configuration is missing/)
      })

      test('throws when AUTH_ENABLED=true and prod env vars are missing', async () => {
        process.env.NODE_ENV = 'production'
        process.env.AUTH_ENABLED = 'true'

        delete process.env.KEYCLOAK_REALM_ISSUER
        delete process.env.KEYCLOAK_JWKS_URI
        delete process.env.KEYCLOAK_TOKEN_AUDIENCE

        const { keycloakAuth } = await import('../plugins/authMiddleware')

        expect(() => keycloakAuth()).toThrow(/Keycloak configuration is missing/)
      })
    })

    describe('requireAdminAuthorization', () => {
      let res: MockResponse<any>
      let next: ReturnType<typeof vi.fn>

      beforeEach(() => {
        process.env.ADMIN_GROUPS = 'ssbno-developers'
        res = createResponse()
        next = vi.fn()
      })

      afterEach(() => {
        process.env = { ...OLD_ENV }
      })

      test('bypasses and provides admin context when AUTH_ENABLED=false', async () => {
        process.env.AUTH_ENABLED = 'false'

        const { requireAdminAuthorization: requireAdminAuthorization } = await import('../plugins/authMiddleware')
        const { asyncLocalStorage } = await import('../src/lib/context')

        const handler = requireAdminAuthorization()
        const req = httpMocks.createRequest()

        let isAdminInContext: boolean | undefined

        const nextWithContextCheck = vi.fn(() => {
          isAdminInContext = asyncLocalStorage.getStore()?.isAdmin
        })

        await handler(req, res, nextWithContextCheck as any)

        expect(nextWithContextCheck).toHaveBeenCalledOnce()
        expect(isAdminInContext).toBe(true)
      })

      test('returns 401 when not authenticated', async () => {
        process.env.AUTH_ENABLED = 'true'

        const { requireAdminAuthorization: requireAdminAuthorization } = await import('../plugins/authMiddleware')

        const handler = requireAdminAuthorization()
        const req = httpMocks.createRequest()

        await handler(req, res, next as any)

        expect(res.statusCode).toBe(401)
        expect(res._getJSONData().message).toBe('Not authenticated')
        expect(next).toHaveBeenCalledTimes(0)
      })

      test('returns 403 when dapla.groups is missing', async () => {
        process.env.AUTH_ENABLED = 'true'

        const { requireAdminAuthorization: requireAdminAuthorization } = await import('../plugins/authMiddleware')

        const handler = requireAdminAuthorization()
        const req = httpMocks.createRequest()
        req.auth = { claims: {} }

        await handler(req, res, next as any)

        expect(res.statusCode).toBe(403)
        expect(res._getJSONData().message).toBe('Missing authorization groups')
        expect(next).toHaveBeenCalledTimes(0)
      })

      test('returns 403 when required group is not present', async () => {
        process.env.AUTH_ENABLED = 'true'

        const { requireAdminAuthorization: requireAdminAuthorization } = await import('../plugins/authMiddleware')

        const handler = requireAdminAuthorization()
        const req = httpMocks.createRequest()

        req.auth = {
          claims: {
            dapla: {
              groups: ['other-group'],
            },
          },
        }

        await handler(req, res, next as any)

        expect(res.statusCode).toBe(403)
        expect(res._getJSONData().message).toBe('Insufficient access')
        expect(next).toHaveBeenCalledTimes(0)
      })

      test('calls next when required group exists', async () => {
        process.env.AUTH_ENABLED = 'true'

        const { requireAdminAuthorization: requireAdminAuthorization } = await import('../plugins/authMiddleware')

        const handler = requireAdminAuthorization()
        const req = httpMocks.createRequest()

        req.auth = {
          claims: {
            dapla: {
              groups: ['ssbno-developers', 'another-group'],
            },
          },
        }

        await handler(req, res, next as any)

        expect(next).toHaveBeenCalledOnce()
        expect(res.statusCode).toBe(200)
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

        expect(res.statusCode).toBe(401)
        expect(res._getJSONData().message).toBe('Missing Bearer token')
      })
    })
  })
})
