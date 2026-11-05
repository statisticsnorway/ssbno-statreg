/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { listReleasedPublications, listReleasedStatistics } from '@/services/legacyService'
import { setDepartmentsNb } from '@/services/klassService'
import { ApprovalStatus } from '@ssbno-statreg/shared'

let prismaMock: any

const createdAt = new Date('2010-11-05T08:02:31.000Z')
const firstRelease = new Date('1979-01-01T00:00:00.000Z')

describe('legacyService', () => {
  beforeEach(() => {
    setDepartmentsNb([
      {
        code: '400',
        name: 'Avdeling',
        divisions: [{ code: '422', name: 'Seksjon for næringslivets konjunkturer' }],
      },
    ])
    prismaMock = {
      statistic: { findMany: vi.fn(() => Promise.resolve([])) },
      release: { findMany: vi.fn(() => Promise.resolve([])) },
      auditLog: { findMany: vi.fn(() => Promise.resolve([])) },
    }
  })

  test('returns released statistics in the dashboard json shape', async () => {
    prismaMock.statistic.findMany.mockResolvedValue([
      {
        id: 12,
        name: 'Elektrisitet',
        name_en: 'Electricity',
        language: 'nb',
        status: 'A',
        division_code: '422',
        yearly_reporting: false,
        first_release: firstRelease,
        date_created: createdAt,
        shortname: { name: 'elektrisitet' },
        statistic_region_levels: [{ region_level: { name: 'Land' } }, { region_level: { name: 'Fylke' } }],
        variants: [{ frequency: { name: 'År' } }, { frequency: { name: 'Måned' } }, { frequency: { name: 'Måned' } }],
      },
    ])
    prismaMock.auditLog.findMany.mockResolvedValue([
      {
        id: 1,
        last_updated: new Date('2026-03-01T00:00:00.000Z'),
        property_name: null,
        old_value: JSON.stringify({ status: 'K', comment: '' }),
        new_value: JSON.stringify({ status: 'A', comment: 'Satt til aktiv' }),
        actor: 'user',
        uri: null,
        persisted_object_version: 1,
        date_created: createdAt,
        class_name: 'Statistic',
        event_name: 'update',
        persisted_object_id: 12,
      },
      {
        id: 2,
        last_updated: new Date('2020-03-01T00:00:00.000Z'),
        property_name: 'internKommentar',
        old_value: '',
        new_value: 'Fjernet en kontakt',
        actor: 'user',
        uri: null,
        persisted_object_version: 1,
        date_created: createdAt,
        class_name: 'Statistic',
        event_name: 'update',
        persisted_object_id: 12,
      },
      {
        id: 3,
        last_updated: new Date('2020-03-01T00:00:00.000Z'),
        property_name: 'kontakter',
        old_value: '[A, B]',
        new_value: '[A]',
        actor: 'user',
        uri: null,
        persisted_object_version: 1,
        date_created: createdAt,
        class_name: 'Statistic',
        event_name: 'update',
        persisted_object_id: 12,
      },
    ])

    const result = await listReleasedStatistics(prismaMock)

    expect(prismaMock.statistic.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { desk_appoval_status: ApprovalStatus.ACCEPTED },
        orderBy: { shortname: { name: 'asc' } },
      })
    )
    expect(result).toStrictEqual({
      statistics: [
        {
          id: 12,
          shortName: 'elektrisitet',
          name: 'Elektrisitet',
          nameEN: 'Electricity',
          dateCreated: '2010-11-05T08:02:31.000Z',
          lang: 'nb',
          ownerCode: '422',
          owner: 'Seksjon for næringslivets konjunkturer',
          status: 'A',
          regionalLevels: 'Fylke, Land',
          variants: 'Måned, År',
          annualReporting: false,
          startYear: '1979',
          firstReleaseStatistic: '1979-01-01T00:00:00.000Z',
          changes: [
            {
              propertyName: 'status',
              oldValue: 'K',
              newValue: 'A',
              modifiedDate: '2026-03-01T00:00:00.000Z',
              comment: 'Satt til aktiv',
            },
            {
              propertyName: 'kontakter',
              oldValue: '[A, B]',
              newValue: '[A]',
              modifiedDate: '2020-03-01T00:00:00.000Z',
              comment: 'Fjernet en kontakt',
            },
          ],
        },
      ],
    })
  })

  test('returns released publications in the dashboard json shape', async () => {
    setDepartmentsNb([
      {
        code: '200',
        name: 'Avdeling',
        divisions: [{ code: '240', name: 'Seksjon for prisstatistikk' }],
      },
    ])
    const publishTime = new Date('2025-01-17T07:00:00.000Z')
    const previousPublishTime = new Date('2025-01-16T07:00:00.000Z')
    const periodFrom = new Date('2024-09-30T22:00:00.000Z')
    const periodTo = new Date('2024-12-30T23:00:00.000Z')
    const modifiedAt = new Date('2024-07-03T07:16:24.000Z')

    prismaMock.release.findMany.mockResolvedValue([
      {
        id: 199822,
        publish_time: publishTime,
        period_from: periodFrom,
        period_to: periodTo,
        date_created: createdAt,
        variant: {
          revision: 'I',
          frequency: { name: 'Kvartal' },
          statistic: {
            id: 4191,
            name: 'Volum- og prisindekser for utenrikshandel med varer',
            division_code: '240',
            shortname: { name: 'uhvp' },
          },
        },
      },
    ])
    prismaMock.auditLog.findMany.mockResolvedValue([
      {
        id: 4,
        last_updated: modifiedAt,
        property_name: 'internKommentar',
        old_value: '',
        new_value: 'Endret publiseringstidspunkt',
        actor: 'user',
        uri: null,
        persisted_object_version: 1,
        date_created: createdAt,
        class_name: 'Release',
        event_name: 'update',
        persisted_object_id: 199822,
      },
      {
        id: 5,
        last_updated: modifiedAt,
        property_name: null,
        old_value: JSON.stringify({
          publish_time: previousPublishTime.toISOString(),
          period_from: periodFrom.toISOString(),
          comment: '',
        }),
        new_value: JSON.stringify({
          publish_time: publishTime.toISOString(),
          period_from: periodTo.toISOString(),
          comment: '',
        }),
        actor: 'user',
        uri: null,
        persisted_object_version: 2,
        date_created: createdAt,
        class_name: 'Release',
        event_name: 'update',
        persisted_object_id: 199822,
      },
    ])

    const result = await listReleasedPublications(prismaMock)

    expect(prismaMock.release.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          desk_appoval_status: ApprovalStatus.ACCEPTED,
          archived: false,
          cancelled: false,
        },
        orderBy: { id: 'asc' },
      })
    )
    expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { class_name: 'Release', persisted_object_id: { in: [199822] } },
      })
    )
    expect(result).toStrictEqual({
      releases: [
        {
          id: 199822,
          frequency: 'Kvartal',
          revision: 'Ingen',
          publishTime: '2025-01-17T07:00:00.000Z',
          periodFrom: '2024-09-30T22:00:00.000Z',
          periodTo: '2024-12-30T23:00:00.000Z',
          dateCreated: '2010-11-05T08:02:31.000Z',
          erEndretDesk: false,
          shortName: 'uhvp',
          statisticId: 4191,
          statisticName: 'Volum- og prisindekser for utenrikshandel med varer',
          ownerCode: '240',
          owner: 'Seksjon for prisstatistikk',
          changes: [
            {
              propertyName: 'tidspunkt',
              oldValue: '2025-01-16T07:00:00.000Z',
              newValue: '2025-01-17T07:00:00.000Z',
              modifiedDate: '2024-07-03T07:16:24.000Z',
              comment: 'Endret publiseringstidspunkt',
            },
          ],
        },
      ],
    })
  })
})
