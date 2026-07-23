import { type JWTPayload } from 'jose'
import { AsyncLocalStorage } from 'node:async_hooks'

export interface AuthContext {
  claims?: JWTPayload | unknown
  username?: string
  email?: string
}

export interface RequestContext {
  auth?: AuthContext
  isAdmin?: boolean
}

export function isCurrentUserAdmin(): boolean {
  return asyncLocalStorage.getStore()?.isAdmin === true
}

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>()
