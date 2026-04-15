import type { UserLookupItem, Users } from '@/types/entra'

import * as entraClient from '@/../plugins/entraReaderClient'

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

        //TODO: Rewrite according to actual implementation
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
