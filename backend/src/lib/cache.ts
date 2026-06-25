import * as entraClient from '@/../plugins/entraReaderClient'
import { NodeCache } from '@cacheable/node-cache'
import type { EntraUser } from '@/types/entra'

const usersCache = new NodeCache({ stdTTL: 60 * 60 * 24, checkperiod: 60 })
const ENTRA_USERS_CACHE_KEY = 'entra-users'

export async function setUsersCache(): Promise<void> {
  // Workaround for integration tests that run in Docker and don't have access to Azure Entra.
  if (process.env.MOCK_ENTRA_USERS === 'true') {
    console.info('setUsersCache: MOCK_ENTRA_USERS is set, using mock user data')
    usersCache.set(ENTRA_USERS_CACHE_KEY, [
      {
        displayName: 'Admin SSB',
        email: 'admin.ssb@ssb.no',
        businessPhone: null,
      },
    ])
    return
  }

  const token = await entraClient.getAccessToken()

  if (!token) {
    console.error('Failed getting access token for entra reader')
    return
  }

  const users = await entraClient.fetchAllUsers(token)
  usersCache.set(ENTRA_USERS_CACHE_KEY, users)
}

export async function getUsersFromCache(): Promise<EntraUser[]> {
  const cachedUsers = usersCache.get(ENTRA_USERS_CACHE_KEY) as EntraUser[] | undefined
  if (cachedUsers) {
    return cachedUsers
  }

  await setUsersCache()
  return cachedUsers ?? []
}

export function clearUsersCache(): void {
  usersCache.del(ENTRA_USERS_CACHE_KEY)
}
