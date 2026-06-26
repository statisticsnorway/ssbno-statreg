import { getUsersFromCache } from '@/lib/cache'
import type { Users } from '@/types/entra'

export async function fetchUsers(users: Users[]) {
  if (!users.length) {
    return []
  }

  const fetchedUsers = await getUsersFromCache()
  const lookupEmails = new Set(users.map((user) => user.email.toLowerCase()))

  return fetchedUsers.filter((user) => {
    const lookupEmail = user.email ?? user.userPrincipalName // TODO: email in ResponsiblePersons table will be replaced by userPrincipalName in the future so we won't need this workaround
    return lookupEmail ? lookupEmails.has(lookupEmail.toLowerCase()) : false
  })
}
