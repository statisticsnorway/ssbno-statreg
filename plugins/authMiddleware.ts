import type { Request, Response, NextFunction } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { requiresAuthPolicy, HttpMethod } from './authPolicy'

const KEYCLOAK_REALM_ISSUER = process.env.KEYCLOAK_REALM_ISSUER
const KEYCLOAK_JWKS_URI = process.env.KEYCLOAK_JWKS_URI
const KEYCLOAK_TOKEN_AUDIENCE = process.env.KEYCLOAK_TOKEN_AUDIENCE

if (!KEYCLOAK_REALM_ISSUER || !KEYCLOAK_JWKS_URI || !KEYCLOAK_TOKEN_AUDIENCE) {
  throw new Error(
    'Missing Keycloak OIDC configuration. ' +
      'Ensure KEYCLOAK_REALM_ISSUER, KEYCLOAK_JWKS_URI, and KEYCLOAK_TOKEN_AUDIENCE are set.'
  )
}

// JWKS is fetched once and cached; jose handles key rotation automatically
const JWKS = createRemoteJWKSet(new URL(KEYCLOAK_JWKS_URI))

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const routePath = req.route?.path || req.path
  const method = req.method.toUpperCase() as HttpMethod

  // Check auth policy first to determine if this endpoint requires authentication
  if (!requiresAuthPolicy(routePath, method)) {
    return next()
  }

  // Fail fast if a protected endpoint is called without a Bearer token
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'You are not authenticated. Missing Bearer token.',
    })
  }

  // The Authorization header contains text like "Bearer <token>"; remove the "Bearer " part and keep the token
  const token = auth.substring(7)

  try {
    // Cryptographically verify the JWT (signature, issuer, audience, expiry)
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: KEYCLOAK_REALM_ISSUER,
      audience: KEYCLOAK_TOKEN_AUDIENCE,
      algorithms: ['RS256'],
    })
    // Attach verified JWT data for internal use by authenticated endpoints
    ;(req as any).jwt = payload
    ;(req as any).token = token

    return next()
  } catch {
    return res.status(401).json({
      error: 'Invalid or expired token',
    })
  }
}
