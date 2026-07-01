import { getAllUsersFromCache } from '@/lib/cache'
import { type Contact } from '@ssbno-statreg/shared'

export async function getContacts(): Promise<Contact[]> {
  const users = await getAllUsersFromCache()

  return Object.values(users).map(({ displayName, userPrincipalName }) => ({
    name: displayName,
    principalName: userPrincipalName,
  }))
}
