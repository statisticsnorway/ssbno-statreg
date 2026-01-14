import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

export let AUTH_ENABLED = process.env.AUTH_ENABLED !== 'false'

export function setAuthEnabled(enabled: boolean) {
  AUTH_ENABLED = enabled
}

export function unauthorized(res: Response, message: string) {
  return res.status(401).json({ error: message })
}

export function forbidden(res: Response, message: string) {
  return res.status(403).json({ error: message })
}

export function getBearerToken(req: Request): string | null {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice('Bearer '.length).trim()
}

export function hasAudience(claims: JWTPayload, required: string): boolean {
  const aud = claims.aud
  if (typeof aud === 'string') return aud === required
  if (Array.isArray(aud)) return aud.includes(required)
  return false
}

export const skipAuth: RequestHandler = (_req, _res, next) => next()
;(skipAuth as any).__skipAuth = true

// eslint-disable-next-line no-unused-vars
export type VerifyJwt = (token: string) => Promise<JWTPayload>

export function makeKeycloakJwtAuth(verifyJwt: VerifyJwt): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = getBearerToken(req)
    if (!token) return unauthorized(res, 'Missing Bearer token')

    try {
      const payload = await verifyJwt(token)
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

export function keycloakJwtAuth(): RequestHandler {
  const dev = process.env.NODE_ENV === 'development'

  const issuer = dev ? process.env.KEYCLOAK_PLAY_REALM_ISSUER : process.env.KEYCLOAK_REALM_ISSUER
  const jwksUri = dev ? process.env.KEYCLOAK_PLAY_JWKS_URI : process.env.KEYCLOAK_JWKS_URI
  const audience = dev ? process.env.KEYCLOAK_PLAY_TOKEN_AUDIENCE : process.env.KEYCLOAK_TOKEN_AUDIENCE

  if (!issuer || !jwksUri || !audience) {
    throw new Error('Missing Keycloak OIDC configuration. Check your environment variables.')
  }

  const JWKS = createRemoteJWKSet(new URL(jwksUri))

  const verifyJwt: VerifyJwt = async (token: string) => {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
      audience,
      algorithms: ['RS256'],
    })
    return payload
  }

  return makeKeycloakJwtAuth(verifyJwt)
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
