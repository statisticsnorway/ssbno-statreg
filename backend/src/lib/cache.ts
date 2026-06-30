import * as entraClient from '@/../plugins/entraReaderClient'
import { NodeCache } from '@cacheable/node-cache'
import type { EntraUser } from '@/types/entra'

const usersCache = new NodeCache({ stdTTL: 60 * 60 * 24, checkperiod: 60 })
const ENTRA_USERS_CACHE_KEY = 'entra-users'
type EntraUsersRecord = Record<string, EntraUser> // key is userPrincipalName

function indexUsersByPrincipalName(users: EntraUser[]): EntraUsersRecord {
  return users.reduce<EntraUsersRecord>((record, user) => {
    record[user.userPrincipalName] = user
    return record
  }, {})
}

export async function setUsersCache(): Promise<void> {
  // Return mocked users for tests and development where application often restarts and/or is missing Azure Entra access
  if (process.env.MOCK_ENTRA_USERS === 'true') {
    usersCache.set(
      ENTRA_USERS_CACHE_KEY,
      indexUsersByPrincipalName([
        {
          displayName: 'Admin SSB',
          mail: 'admin.ssb@ssb.no',
          userPrincipalName: 'admin@ssb.no',
          businessPhones: null,
        },
      ])
    )
    return
  }

  try {
    const token = await entraClient.getAccessToken()

    if (!token) {
      console.error('Failed getting access token for entra reader')
      return
    }

    const users = await entraClient.fetchAllUsers(token)
    usersCache.set(ENTRA_USERS_CACHE_KEY, indexUsersByPrincipalName(users))
  } catch (error) {
    console.error(`Failed to set users cache: ${error}`)
    return
  }
}

export async function getAllUsersFromCache(): Promise<EntraUsersRecord> {
  const cachedUsers = usersCache.get(ENTRA_USERS_CACHE_KEY) as EntraUsersRecord | undefined
  if (cachedUsers) {
    return cachedUsers
  }

  await setUsersCache()
  const refreshedUsers = usersCache.get(ENTRA_USERS_CACHE_KEY) as EntraUsersRecord | undefined
  return refreshedUsers ?? {}
}

export function clearUsersCache(): void {
  usersCache.del(ENTRA_USERS_CACHE_KEY)
}
