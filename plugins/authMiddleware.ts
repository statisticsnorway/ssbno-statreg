import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

const AUTH_ENABLED = process.env.AUTH_ENABLED !== 'false'

function unauthorized(res: Response, message: string) {
  return res.status(401).json({ error: message })
}

function forbidden(res: Response, message: string) {
  return res.status(403).json({ error: message })
}

function getBearerToken(req: Request): string | null {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice('Bearer '.length).trim()
}

function hasAudience(claims: JWTPayload, required: string): boolean {
  const aud = claims.aud
  if (typeof aud === 'string') return aud === required
  if (Array.isArray(aud)) return aud.includes(required)
  return false
}

export const skipAuth: RequestHandler = (_req, _res, next) => next()
;(skipAuth as any).__skipAuth = true

function keycloakJwtAuth(): RequestHandler {
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
    const token = getBearerToken(req)
    if (!token) return unauthorized(res, 'Missing Bearer token')

    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer,
        audience,
        algorithms: ['RS256'],
      })
      // claims might need to be removed later - as it might not be needed in the future
      req.auth = {
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

export function requireAuth(): RequestHandler {
  return AUTH_ENABLED ? keycloakJwtAuth() : (_req, _res, next) => next()
}

// Require aud authorization - this function is the basis for group authorization with entra id later
// might not be needed at all later on if we get groups from keycloak dapla user info mapper
export function requireAudience(requiredAudience: string): RequestHandler {
  if (!AUTH_ENABLED) return (_req, _res, next) => next()

  return (req, res, next) => {
    if (!req.auth) return unauthorized(res, 'Not authenticated')
    if (!hasAudience(req.auth.claims as JWTPayload, requiredAudience)) {
      return forbidden(res, 'Insufficient access')
    }
    return next()
  }
}
