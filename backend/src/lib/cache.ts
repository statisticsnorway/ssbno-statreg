import * as entraClient from '@/../plugins/entraReaderClient'
import { NodeCache } from '@cacheable/node-cache'
import type { EntraUser } from '@/types/entra'
import { getDivisionsFromKlass } from '@/services/klassService'
import { Division } from '@ssbno-statreg/shared'

const cacheDay = new NodeCache({ stdTTL: 60 * 60 * 24, checkperiod: 60 })
const ENTRA_USERS_CACHE_KEY = 'entra-users'
const DIVISIONS_CACHE_KEY = 'klass-divisions'
type EntraUsersRecord = Record<string, EntraUser> // key is userPrincipalName

export function indexUsersByPrincipalName(users: EntraUser[]): EntraUsersRecord {
  return users.reduce<EntraUsersRecord>((record, user) => {
    record[user.userPrincipalName] = user
    return record
  }, {})
}

async function setDivisionsCache(): Promise<void> {
  try {
    cacheDay.set(DIVISIONS_CACHE_KEY, await getDivisionsFromKlass())
  } catch (error) {
    console.log(`Failed to cache divisions from Klass, error: ${error}`)
    return
  }
}

export async function getDivisionsCache(): Promise<Division[]> {
  const cachedDivisions = cacheDay.get(DIVISIONS_CACHE_KEY) as Division[] | undefined
  if (cachedDivisions) return cachedDivisions
  else {
    await setDivisionsCache()
    const cachedDivisions = cacheDay.get(DIVISIONS_CACHE_KEY) as Division[] | undefined
    return cachedDivisions ?? []
  }
}

export async function setUsersCache(): Promise<void> {
  // Return mocked users for tests and development where application often restarts and/or is missing Azure Entra access
  if (process.env.MOCK_ENTRA_USERS === 'true') {
    cacheDay.set(
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
    cacheDay.set(ENTRA_USERS_CACHE_KEY, indexUsersByPrincipalName(users))
  } catch (error) {
    console.error(`Failed to set users cache: ${error}`)
    return
  }
}

export async function getAllUsersFromCache(): Promise<EntraUsersRecord> {
  const cachedUsers = cacheDay.get(ENTRA_USERS_CACHE_KEY) as EntraUsersRecord | undefined
  if (cachedUsers) {
    return cachedUsers
  }

  await setUsersCache()
  const refreshedUsers = cacheDay.get(ENTRA_USERS_CACHE_KEY) as EntraUsersRecord | undefined
  return refreshedUsers ?? {}
}

export function clearUsersCache(): void {
  cacheDay.del(ENTRA_USERS_CACHE_KEY)
}
