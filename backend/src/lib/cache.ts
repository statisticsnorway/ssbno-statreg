import * as entraClient from '@/../plugins/entraReaderClient'
import { NodeCache } from '@cacheable/node-cache'
import type { EntraUser } from '@/types/entra'

const usersCache = new NodeCache({ stdTTL: 60 * 60 * 24, checkperiod: 60 })
const ENTRA_USERS_CACHE_KEY = 'entra-users'

export async function setUsersCache(): Promise<void> {
  // Return mocked users for tests and development where application often restarts and/or is missing Azure Entra access
  if (process.env.MOCK_ENTRA_USERS === 'true') {
    usersCache.set(ENTRA_USERS_CACHE_KEY, [
      {
        displayName: 'Admin SSB',
        email: 'admin.ssb@ssb.no',
        userPrincipalName: 'admin@ssb.no',
        businessPhone: null,
      },
    ])
    return
  }

  try {
    const token = await entraClient.getAccessToken()

    if (!token) {
      console.error('Failed getting access token for entra reader')
      return
    }

    const users = await entraClient.fetchAllUsers(token)
    usersCache.set(ENTRA_USERS_CACHE_KEY, users)
  } catch (error) {
    console.error(`Failed to set users cache: ${error}`)
    return
  }
}

export async function getUsersFromCache(): Promise<EntraUser[]> {
  const cachedUsers = usersCache.get(ENTRA_USERS_CACHE_KEY) as EntraUser[] | undefined
  if (cachedUsers) {
    return cachedUsers
  }

  await setUsersCache()
  return (usersCache.get(ENTRA_USERS_CACHE_KEY) as EntraUser[] | undefined) ?? []
}

export function clearUsersCache(): void {
  usersCache.del(ENTRA_USERS_CACHE_KEY)
}
