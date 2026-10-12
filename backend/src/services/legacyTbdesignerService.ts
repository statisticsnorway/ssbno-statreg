import { ApprovalStatus } from '@ssbno-statreg/shared'
import type { ExtendedPrismaClient } from '@/lib/prisma'

export type LegacyTbdesignerPrisma = Pick<ExtendedPrismaClient, 'statistic'>

const OSLO_TIME_ZONE = 'Europe/Oslo'

type ApprovedStatistic = {
  id: number
  shortname: { name: string }
}

export async function getApprovedStatisticsXml(prisma: LegacyTbdesignerPrisma, now = new Date()): Promise<string> {
  const statistics = await prisma.statistic.findMany({
    where: { dir_appoval_status: ApprovalStatus.ACCEPTED },
    select: { id: true, shortname: { select: { name: true } } },
    orderBy: { shortname: { name: 'asc' } },
  })

  return toApprovedStatisticsXml(statistics, now)
}

export function toApprovedStatisticsXml(statistics: ApprovedStatistic[], now: Date): string {
  const rows = statistics
    .map((statistic) => `<statistikk id="${statistic.id}" kortnavn="${escapeXmlAttribute(statistic.shortname.name)}"/>`)
    .join('\n')

  const body = rows.length > 0 ? `\n${rows}\n` : '\n'
  return `<statistikker antall="${statistics.length}" dato="${formatLegacyDate(now)}">${body}</statistikker>`
}

function escapeXmlAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}

// Java Date.toString() in Europe/Oslo: "Mon Oct 12 09:31:16 CEST 2026"
export function formatLegacyDate(date: Date): string {
  const part = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: OSLO_TIME_ZONE,
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      year: 'numeric',
      timeZoneName: 'longOffset',
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value])
  )

  const day = part.day.replace(/^0/, ' ')
  const zone = part.timeZoneName === 'GMT+02:00' ? 'CEST' : 'CET'

  return `${part.weekday} ${part.month} ${day} ${part.hour}:${part.minute}:${part.second} ${zone} ${part.year}`
}
