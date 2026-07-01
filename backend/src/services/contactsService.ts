import { getAllUsersFromCache } from '@/lib/cache'
import type { ExtendedPrismaClient } from '@/lib/prisma'
import { type Contact } from '@ssbno-statreg/shared'

export type ContactPrisma = Pick<ExtendedPrismaClient, 'responsiblePerson'>

export async function getContacts(): Promise<Contact[]> {
  const users = await getAllUsersFromCache()

  return Object.values(users).map(({ displayName, userPrincipalName }) => ({
    name: displayName,
    principalName: userPrincipalName,
  }))
}
