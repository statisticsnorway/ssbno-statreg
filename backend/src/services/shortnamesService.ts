import type { ExtendedPrismaClient } from '@/lib/prisma'
import { type ShortnameListing } from '@ssbno-statreg/shared'

export type ShortnamePrisma = Pick<ExtendedPrismaClient, 'shortname' | 'statistic'>

export async function getShortnames(prisma: ShortnamePrisma): Promise<ShortnameListing[]> {
  const shortnames = await prisma.shortname.findMany({
    select: {
      name: true,
      statistic: { select: { name: true } },
    },
    where: { NOT: { statistic: null } },
  })

  const result = shortnames.map((item) => {
    return { shortname: item.name, statistic_name: item.statistic!.name }
  })

  return result
}

export async function createShortname(prisma: ShortnamePrisma, body: unknown): Promise<void> {
  if (body === null || typeof body !== 'object' || !('shortname' in body)) {
    throw { statregError: "Missing required field 'shortname'." }
  }

  const shortname = parseShortname(body.shortname)

  const existing = await prisma.shortname.findUnique({
    where: { name: shortname },
    select: { id: true },
  })

  if (existing) {
    throw { statregError: `Shortname '${shortname}' already exists` }
  }

  const now = new Date()
  await prisma.shortname.create({
    data: {
      name: shortname,
      date_created: now,
      last_updated: now,
    },
  })
}

export function parseShortname(value: unknown): string {
  if (typeof value !== 'string') {
    throw { statregError: "Field 'shortname' must be a string." }
  }

  if (!/^[a-z-]{1,14}$/.test(value)) {
    throw {
      statregError:
        "Field 'shortname' must only contain lowercase letters (a-z) and hyphens (-), and be at most 14 characters.",
    }
  }

  return value
}
