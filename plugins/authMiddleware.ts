import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

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

function createKeycloakAuthMiddleware(issuer: string, jwksUri: string, audience: string): RequestHandler {
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

export function keycloakAuth(): RequestHandler {
  const isDev = process.env.NODE_ENV === 'development'

  const issuer = isDev ? process.env.KEYCLOAK_PLAY_REALM_ISSUER : process.env.KEYCLOAK_REALM_ISSUER

  const jwksUri = isDev ? process.env.KEYCLOAK_PLAY_JWKS_URI : process.env.KEYCLOAK_JWKS_URI

  const audience = isDev ? process.env.KEYCLOAK_PLAY_TOKEN_AUDIENCE : process.env.KEYCLOAK_TOKEN_AUDIENCE

  if (!issuer || !jwksUri || !audience) {
    throw new Error('AUTH_ENABLED=true but Keycloak configuration is missing')
  }

  return createKeycloakAuthMiddleware(issuer, jwksUri, audience)
}

export function requireAuthentication(): RequestHandler {
  return process.env.AUTH_ENABLED === 'false' ? skipAuth : keycloakAuth()
}

export function requireUserAuthorization(requiredGroup: string): RequestHandler {
  if (process.env.AUTH_ENABLED === 'false') return skipAuth

  return (req, res, next) => {
    if (!req.auth) {
      return unauthorized(res, 'Not authenticated')
    }

    const claims = req.auth.claims as JWTPayload & {
      dapla?: {
        groups?: string[]
      }
    }

    const groups = claims.dapla?.groups

    if (!Array.isArray(groups)) {
      return forbidden(res, 'Missing authorization groups')
    }

    if (!groups.includes(requiredGroup)) {
      return forbidden(res, 'Insufficient access')
    }

    return next()
  }
}
