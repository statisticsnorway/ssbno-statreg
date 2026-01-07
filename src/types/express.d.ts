// Declares the `auth` property on Express.Request object so TypeScript accepts 'req.auth'

type AuthContext = {
  token: string
  claims: unknown
  username?: string
  email?: string
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext
    }
  }
}

export {}
