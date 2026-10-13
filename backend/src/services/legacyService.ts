import type { ExtendedPrismaClient } from '@/lib/prisma'
import { ApprovalStatus } from '@ssbno-statreg/shared'

export async function getApprovedStatisticsXml(
  prisma: Pick<ExtendedPrismaClient, 'statistic'>,
): Promise<string> {
  const statistics = await prisma.statistic.findMany({
    where: {
      status: 'A',
      desk_appoval_status: ApprovalStatus.ACCEPTED,
    },
    select: {
      id: true,
      shortname: { select: { name: true } },
    },
    orderBy: { shortname: { name: 'asc' } },
  })

  const rows = statistics.map(
    ({ id, shortname }) => `<statistikk id="${id}" kortnavn="${shortname.name}"/>`,
  )

  return `<statistikker antall="${statistics.length}" dato="${formatLegacyDate()}">
${rows.join('\n')}
</statistikker>`
}

function formatLegacyDate(): string {
  const date = new Date().toString().split(' ')
  const zone = date[5] === 'GMT+0200' ? 'CEST' : 'CET'

  return `${date[0]} ${date[1]} ${date[2]} ${date[4]} ${zone} ${date[3]}`
}