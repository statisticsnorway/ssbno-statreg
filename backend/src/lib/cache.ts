import { NodeCache } from '@cacheable/node-cache'
import type { EntraUser } from '@/types/entra'

// This is an example of how we can implement an in-memory cache of an object of any type.
// TODO: MIM-2824 The timeCache example should be removed before production deployment, but can serve as a template i.e. when fetching users from Entra.
const timeCache = new NodeCache({ stdTTL: 600, checkperiod: 60 })

function resetTimeCache(): Date {
  const currentTime = new Date()

  timeCache.set('time', currentTime)

  return currentTime
}

export function getTimeCache(): Date {
  const cachedTime: Date | undefined = timeCache.get('time') as Date | undefined
  return cachedTime ?? resetTimeCache()
}

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
