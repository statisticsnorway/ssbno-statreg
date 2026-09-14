// Declares the `auth` property on Express.Request object so TypeScript accepts 'req.auth'

type AuthContext = {
  claims: unknown
  username?: string
  email?: string
  name?: string
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext
    }
  }
}

export {}
