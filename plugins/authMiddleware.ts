import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

export type AuthContext = {
  token: string
  claims: JWTPayload
  username?: string
  email?: string
}

function getBearerToken(req: Request): string | null {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice('Bearer '.length).trim()
}

function unauthorized(res: Response, message: string) {
  return res.status(401).json({ error: message })
}

function forbidden(res: Response, message: string) {
  return res.status(403).json({ error: message })
}

function hasAudience(claims: JWTPayload, required: string): boolean {
  const aud = claims.aud
  if (typeof aud === 'string') return aud === required
  if (Array.isArray(aud)) return aud.includes(required)
  return false
}

// Mark a route as public by setting a flag on req
export const skipAuth: RequestHandler = (req, _res, next) => {
  ;(req as any)._skipAuth = true
  next()
}

// Auth middleware that respects skipAuth flag
export function createRequireAuth(): RequestHandler {
  const issuer = process.env.KEYCLOAK_REALM_ISSUER
  const jwksUri = process.env.KEYCLOAK_JWKS_URI
  const audience = process.env.KEYCLOAK_TOKEN_AUDIENCE

  if (!issuer || !jwksUri || !audience) {
    throw new Error(
      'Missing Keycloak OIDC configuration. Ensure KEYCLOAK_REALM_ISSUER, KEYCLOAK_JWKS_URI, and KEYCLOAK_TOKEN_AUDIENCE are set.'
    )
  }

  const JWKS = createRemoteJWKSet(new URL(jwksUri))

  return async (req: Request, res: Response, next: NextFunction) => {
    if ((req as any)._skipAuth) return next()

    const token = getBearerToken(req)
    if (!token) return unauthorized(res, 'Missing Bearer token')

    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer,
        audience,
        algorithms: ['RS256'],
      })

      req.auth = {
        token,
        claims: payload,
        username: typeof payload.preferred_username === 'string' ? payload.preferred_username : undefined,
        email: typeof payload.email === 'string' ? payload.email : undefined,
      }

      return next()
    } catch {
      return unauthorized(res, 'Invalid or expired token')
    }
  }
}

export function requireAudience(requiredAudience: string): RequestHandler {
  return (req, res, next) => {
    if (!req.auth) return unauthorized(res, 'Not authenticated')
    if (!hasAudience(req.auth.claims, requiredAudience)) return forbidden(res, 'Insufficient access')
    return next()
  }
}
