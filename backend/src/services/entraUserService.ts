import { getUsersFromCache } from '@/lib/cache'
import type { Users } from '@/types/entra'

export async function fetchUsers(users: Users[]) {
  if (!users.length) {
    return []
  }

  const fetchedUsers = await getUsersFromCache()
  // TODO: Replace username with userPrincipalName after migration
  const lookupUserPrincipalNames = new Set(users.map((user) => `${user.username}@ssb.no`))

  return fetchedUsers.filter((user) => {
    return lookupUserPrincipalNames.has(user.userPrincipalName)
  })
}
