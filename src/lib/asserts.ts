import { sanitize } from '@/lib/utils'
import { ReleasePrisma } from '@/services/releasesService'

export async function assertStatisticExists(shortname: string, prisma: ReleasePrisma) {
  const name = sanitize(shortname)

  const exists = await prisma.statistic.findFirst({
    where: { shortname: { name } },
    select: { id: true },
  })

  if (!exists) {
    throw { status: 404, statregError: `Statistic '${shortname}' not found` }
  }
}

export async function assertVariantExists(variantId: number, prisma: ReleasePrisma) {
  const exists = await prisma.variant.findUnique({
    where: { id: variantId },
    select: { id: true },
  })

  if (!exists) {
    throw { status: 404, statregError: `Variant '${variantId}' not found` }
  }
}

export async function assertVariantMatchesShortname(variantId: number, shortname: string, prisma: ReleasePrisma) {
  const variant = await prisma.variant.findUnique({
    where: { id: variantId },
    select: {
      statistic: {
        select: {
          shortname: { select: { name: true } },
        },
      },
    },
  })

  if (!variant || variant.statistic.shortname.name !== sanitize(shortname)) {
    throw {
      status: 404,
      statregError: `Variant does not belong to statistic '${shortname}'`,
    }
  }
}
