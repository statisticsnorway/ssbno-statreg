import type { UserLookupItem, EntraUser, Users } from '@/types/entra'

import * as entraClient from '@/../plugins/entraReaderClient'
import { getUsersCache, setUsersCache } from '@/lib/cache'

export let ALL_USERS: EntraUser[] = []

export function setUsers(users: EntraUser[]): void {
  ALL_USERS = users
}

export async function initializeUsers(): Promise<void> {
  const cachedUsers = getUsersCache()

  if (cachedUsers) {
    setUsers(cachedUsers)
    return
  }

  setUsers(await fetchAllUsers())
}

export async function fetchAllUsers(): Promise<EntraUser[]> {
  const token = await entraClient.getAccessToken()

  if (!token) {
    console.error('Failed getting access token for entra reader')
    return []
  }

  try {
    return setUsersCache(await entraClient.fetchAllUsers(token))
  } catch (error) {
    console.error(error)
    return getUsersCache() ?? []
  }
}

export async function fetchUsers(users: Users[]) {
  if (!users?.length) return Promise.resolve([])

  const token = await entraClient.getAccessToken()

  // Using initials to compose email on shortform, fallback on provided email for ie. infotjenesten@ssb.no
  const userEmails = users.map((user) => {
    return user.username ? `${user.username}@ssb.no` : user.email
  })

  if (!token) {
    console.error(`Failed getting access token for entra reader getting user: ${userEmails.join(',')}`)
    return Promise.resolve(users)
  }

  const results = await Promise.all(
    userEmails.map(async (email): Promise<UserLookupItem> => {
      try {
        const user = await entraClient.fetchUserByEmail(email, token)

        if (user) {
          return {
            lookupEmail: email,
            user,
          }
        }

        return {
          lookupEmail: email,
          user: null,
          error: 'User not found',
        }
      } catch {
        return {
          lookupEmail: email,
          user: null,
          error: 'Lookup failed',
        }
      }
    })
  )
  return results
}
