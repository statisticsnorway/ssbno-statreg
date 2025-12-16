import type { Request, Response, NextFunction } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { authPolicy, HttpMethod } from './authPolicy'

/**
 * Keycloak / OpenID Connect configuration
 * These values are NOT secrets
 * They identify the issuing realm and intended audience
 */
const KEYCLOAK_REALM_ISSUER = process.env.KEYCLOAK_REALM_ISSUER
const KEYCLOAK_JWKS_URI = process.env.KEYCLOAK_JWKS_URI
const KEYCLOAK_TOKEN_AUDIENCE = process.env.KEYCLOAK_TOKEN_AUDIENCE

if (!KEYCLOAK_REALM_ISSUER || !KEYCLOAK_JWKS_URI || !KEYCLOAK_TOKEN_AUDIENCE) {
  throw new Error(
    'Missing Keycloak OIDC configuration. ' +
      'Ensure KEYCLOAK_REALM_ISSUER, KEYCLOAK_JWKS_URI, and KEYCLOAK_TOKEN_AUDIENCE are set.'
  )
}

/**
 * JWKS client
 * - fetches public signing keys from Keycloak
 * - caches them in memory
 * - handles key rotation automatically
 */
const JWKS = createRemoteJWKSet(new URL(KEYCLOAK_JWKS_URI))

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const routePath = req.route?.path || req.path
  const method = req.method.toUpperCase() as HttpMethod

  const routeConfig = authPolicy[routePath]
  const requiresAuth = !routeConfig || routeConfig[method] !== false

  if (!requiresAuth) {
    return next()
  }

  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'You are not authenticated. Missing Bearer token.',
    })
  }

  const token = auth.substring(7)

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: KEYCLOAK_REALM_ISSUER,
      audience: KEYCLOAK_TOKEN_AUDIENCE,
      algorithms: ['RS256'],
    })

    ;(req as any).jwt = payload
    ;(req as any).token = token

    return next()
  } catch {
    return res.status(401).json({
      error: 'Invalid or expired token',
    })
  }
}
