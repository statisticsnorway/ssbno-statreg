import type { ExtendedPrismaClient } from '@/lib/prisma'
import { type Contact } from '@ssbno-statreg/shared'

export type ContactPrisma = Pick<ExtendedPrismaClient, 'responsiblePerson'>

export async function getContacts(prisma: ContactPrisma): Promise<Contact[]> {
  const contacts = await prisma.responsiblePerson.findMany({
    select: {
      username: true,
      email: true,
    },
  })

  return contacts.map((contact) => ({
    username: contact.username ?? '',
    email: contact.email,
  }))
}
