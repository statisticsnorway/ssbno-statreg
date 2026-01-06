import type { AuthContext } from '../../plugins/authMiddleware'

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext
    }
  }
}

export {}
