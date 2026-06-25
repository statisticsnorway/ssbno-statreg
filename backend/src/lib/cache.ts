import { NodeCache } from '@cacheable/node-cache'
import type { EntraUser } from '@/types/entra'

const usersCache = new NodeCache({ stdTTL: 600, checkperiod: 60 })
const ENTRA_USERS_CACHE_KEY = 'entra-users'

export function setUsersCache(users: EntraUser[]): EntraUser[] {
  usersCache.set(ENTRA_USERS_CACHE_KEY, users)
  return users
}

export function getUsersCache(): EntraUser[] | undefined {
  return usersCache.get(ENTRA_USERS_CACHE_KEY) as EntraUser[] | undefined
}

export function clearUsersCache(): void {
  usersCache.del(ENTRA_USERS_CACHE_KEY)
}
