import type { RequestHandler } from 'express'

let cachedToken: string | null = null
let tokenFetchAttempted = false

export function devMiddleware(): RequestHandler {
  return async (req, _res, next) => {
    if (process.env.NODE_ENV !== 'development') return next()

    if (!req.headers.authorization && !cachedToken && !tokenFetchAttempted) {
      tokenFetchAttempted = true

      const { KEYCLOAK_PLAY_REALM_ISSUER, KEYCLOAK_PLAY_CLIENT_ID, KEYCLOAK_PLAY_CLIENT_SECRET } = process.env
      if (!KEYCLOAK_PLAY_REALM_ISSUER || !KEYCLOAK_PLAY_CLIENT_ID || !KEYCLOAK_PLAY_CLIENT_SECRET) {
        console.log('[devMiddleware] dev token disabled (missing envs)')
        return next()
      }

      try {
        const response = await fetch(`${KEYCLOAK_PLAY_REALM_ISSUER}/protocol/openid-connect/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: KEYCLOAK_PLAY_CLIENT_ID,
            client_secret: KEYCLOAK_PLAY_CLIENT_SECRET,
          }),
        })

        if (!response.ok) {
          console.log('[devMiddleware] dev token fetch failed:', await response.text())
          return next()
        }

        cachedToken = ((await response.json()) as { access_token: string }).access_token
        console.log('[devMiddleware] dev token injected')
      } catch (error: any) {
        console.log('[devMiddleware] dev token fetch error:', error.message)
      }
    }

    if (!req.headers.authorization && cachedToken) {
      req.headers.authorization = `Bearer ${cachedToken}`
    }

    next()
  }
}
