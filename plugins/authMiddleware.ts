import type { Request, Response, NextFunction } from 'express'

export function extractJwt(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing Bearer token' })
  }

  const token = auth.substring(7)
  let payload

  try {
    payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'))
  } catch {
    return res.status(400).json({ message: 'Invalid JWT format' })
  }

  // Attach to request
  ;(req as any).jwt = payload
  ;(req as any).token = token

  next()
}
