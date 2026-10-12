import { describe, expect, test, vi } from 'vitest'
import { ApprovalStatus } from '@ssbno-statreg/shared'
import { formatLegacyDate, getApprovedStatisticsXml, toApprovedStatisticsXml } from '@/services/legacyTbdesignerService'

const summer = new Date('2026-10-12T07:31:16.000Z')

describe('legacyTbdesignerService', () => {
  test('formats the date like Java Date.toString in Europe/Oslo', () => {
    expect(formatLegacyDate(summer)).toBe('Mon Oct 12 09:31:16 CEST 2026')
    expect(formatLegacyDate(new Date('2026-10-05T07:00:00.000Z'))).toBe('Mon Oct  5 09:00:00 CEST 2026')
    expect(formatLegacyDate(new Date('2026-01-12T08:31:16.000Z'))).toBe('Mon Jan 12 09:31:16 CET 2026')
  })

  test('renders approved statistics as the legacy XML list', () => {
    const xml = toApprovedStatisticsXml(
      [
        { id: 137311, shortname: { name: 'aap' } },
        { id: 4379, shortname: { name: 'adopsjon' } },
      ],
      summer
    )

    expect(xml).toBe(
      `<statistikker antall="2" dato="Mon Oct 12 09:31:16 CEST 2026">
<statistikk id="137311" kortnavn="aap"/>
<statistikk id="4379" kortnavn="adopsjon"/>
</statistikker>`
    )
  })

  test('escapes kortnavn and reports an empty list', () => {
    const xml = toApprovedStatisticsXml([{ id: 1, shortname: { name: 'a&b"c' } }], summer)

    expect(xml).toContain('kortnavn="a&amp;b&quot;c"')
    expect(toApprovedStatisticsXml([], summer)).toBe(
      `<statistikker antall="0" dato="Mon Oct 12 09:31:16 CEST 2026">
</statistikker>`
    )
  })

  test('loads statistics approved by dir_flyt, ordered by kortnavn', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 1, shortname: { name: 'aku' } }])
    const xml = await getApprovedStatisticsXml({ statistic: { findMany } } as never, summer)

    expect(findMany).toHaveBeenCalledWith({
      where: { dir_appoval_status: ApprovalStatus.ACCEPTED },
      select: { id: true, shortname: { select: { name: true } } },
      orderBy: { shortname: { name: 'asc' } },
    })
    expect(xml).toContain('<statistikk id="1" kortnavn="aku"/>')
    expect(xml).toContain('antall="1"')
  })
})
