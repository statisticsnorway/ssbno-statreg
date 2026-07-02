import { type RequestHandler, Router } from 'express'
import { type JWTPayload } from 'jose'

const AUTH_PREFIX = '/api/auth'

function getAdminGroups(): string[] {
  return process.env.ADMIN_GROUPS?.split(',') ?? []
}

function isAdmin(claimGroups: string[] | undefined): boolean {
  const adminGroups = getAdminGroups()
  return adminGroups.some((group) => claimGroups?.includes(group))
}

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
        isAdmin: false,
        email: '',
        fullName: '',
      })
      return
    }

    const claims = req.auth.claims as JWTPayload & {
      dapla?: {
        groups?: string[]
      }
    }

    const claimGroups = claims.dapla?.groups

    res.json({
      isAdmin: isAdmin(claimGroups),
      email: req.auth?.email,
      fullName: claims.name,
    })
  })

  return router
}
