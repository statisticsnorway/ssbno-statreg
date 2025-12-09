import type { Request, Response, NextFunction } from "express"
import { Buffer } from "buffer"
import { authPolicy, HttpMethod } from "./authPolicy"
//AuthMiddleware enforces AuthPolicy

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const routePath = req.route?.path || req.path
  const method = req.method.toUpperCase() as HttpMethod

  const routeConfig = authPolicy[routePath]

  // Secure default:
  // If route not listed OR method not listed → authentication required
  const requiresAuth = !routeConfig || routeConfig[method] !== false

  if (!requiresAuth) {
    return next()
  }

  const auth = req.headers.authorization
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).send("You are not authenticated.\nMissing Bearer token.")
  }

  const token = auth.substring(7)
  let payload

  try {
    payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString("utf8")
    )
  } catch {
    return res.status(400).send("Invalid JWT format.")
  }

  ;(req as any).jwt = payload
  ;(req as any).token = token

  next()
}
