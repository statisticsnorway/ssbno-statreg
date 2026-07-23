import { type RequestHandler, Router } from 'express'
import { type JWTPayload } from 'jose'
import { isAdmin } from '@/../plugins/authMiddleware'

const AUTH_PREFIX = '/api/auth'

export default function createAuthRouter(requireAuth: RequestHandler): Router {
  const router = Router()

  // TODO: MIM-2824 Remove this endpoint before we go live!
  router.get(`${AUTH_PREFIX}/me`, requireAuth, (req, res) => {
    // For local testing, add requireUserAuthentication here
    res.json({
      claims: req.auth?.claims,
      username: req.auth?.username,
      email: req.auth?.email,
    })
  })

  router.get(`${AUTH_PREFIX}/authenticate`, requireAuth, (req, res) => {
    // We want a default object if auth is not available or not in use.
    if (!req.auth) {
      res.json({
        isAdmin: process.env.AUTH_ENABLED === 'false',
        email: '',
        fullName: '',
      })
      return
    }

    const claims = req.auth.claims as JWTPayload

    res.json({
      isAdmin: isAdmin(claims),
      email: req.auth?.email,
      fullName: claims.name,
    })
  })

  return router
}
