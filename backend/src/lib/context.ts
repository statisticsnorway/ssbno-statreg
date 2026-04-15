import { type JWTPayload } from 'jose'
import { AsyncLocalStorage } from 'node:async_hooks'

export interface AuthContext {
  claims?: JWTPayload | unknown
  username?: string
  email?: string
}

export interface RequestContext {
  auth?: AuthContext
}

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>()
