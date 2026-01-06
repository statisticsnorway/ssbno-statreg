import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

export type AuthContext = {
  token: string
  claims: JWTPayload
  username?: string
  email?: string
}

// Extract Bearer token from Authorization header
function getBearerToken(req: Request): string | null {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice('Bearer '.length).trim()
}

// Check if JWT audience matches required value
function audContains(claims: JWTPayload, required: string): boolean {
  const aud = claims.aud
  if (typeof aud === 'string') return aud === required
  if (Array.isArray(aud)) return aud.includes(required)
  return false
}

// Respond with 401
function unauthorized(res: Response, message: string) {
  return res.status(401).json({ error: message })
}

// Respond with 403
function forbidden(res: Response, message: string) {
  return res.status(403).json({ error: message })
}

// Verify JWT and attach auth info to request
export function createAuthMiddleware(): RequestHandler {
  const KEYCLOAK_REALM_ISSUER = process.env.KEYCLOAK_REALM_ISSUER
  const KEYCLOAK_JWKS_URI = process.env.KEYCLOAK_JWKS_URI
  const KEYCLOAK_TOKEN_AUDIENCE = process.env.KEYCLOAK_TOKEN_AUDIENCE

  if (!KEYCLOAK_REALM_ISSUER || !KEYCLOAK_JWKS_URI || !KEYCLOAK_TOKEN_AUDIENCE) {
    throw new Error(
      'Missing Keycloak OIDC configuration. Ensure KEYCLOAK_REALM_ISSUER, KEYCLOAK_JWKS_URI, and KEYCLOAK_TOKEN_AUDIENCE are set.'
    )
  }

  const JWKS = createRemoteJWKSet(new URL(KEYCLOAK_JWKS_URI))

  return async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = getBearerToken(req)
    if (!token) return unauthorized(res, 'Missing Bearer token')

    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: KEYCLOAK_REALM_ISSUER,
        audience: KEYCLOAK_TOKEN_AUDIENCE,
        algorithms: ['RS256'],
      })

      const username =
        (payload.preferred_username as string | undefined) ??
        (payload['preferredUsername'] as string | undefined) ??
        (payload['username'] as string | undefined)

      const email =
        (payload.email as string | undefined) ??
        (payload['upn'] as string | undefined) ??
        (payload['emailAddress'] as string | undefined)

      req.auth = { token, claims: payload, username, email }
      return next()
    } catch {
      return unauthorized(res, 'Invalid or expired token')
    }
  }
}

// Require specific audience in JWT
export function requireAudience(requiredAudience: string): RequestHandler {
  return (req, res, next) => {
    const auth = req.auth
    if (!auth) return unauthorized(res, 'Not authenticated')

    if (!audContains(auth.claims, requiredAudience)) {
      return forbidden(res, 'Insufficient access')
    }
    return next()
  }
}

// Require at least one of multiple audiences
export function requireAnyAudience(...requiredAudiences: string[]): RequestHandler {
  return (req, res, next) => {
    const auth = req.auth
    if (!auth) return unauthorized(res, 'Not authenticated')

    const ok = requiredAudiences.some((a) => audContains(auth.claims, a))
    if (!ok) {
      return forbidden(res, 'Insufficient access')
    }
    return next()
  }
}
