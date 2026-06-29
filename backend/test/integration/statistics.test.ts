import { afterAll, describe, expect, test, vi } from 'vitest'
import { StatisticDetails, StatisticListingResponse } from '@ssbno-statreg/shared'
import { prisma } from '@/lib/prisma'
import { createApp } from '@/app'
import request from 'supertest'
import {
  cleanupCreatedStatistics,
  createTestShortname,
  readStatisticFromDb,
  type StatisticWithShortname,
} from './integrationUtils'

vi.mock(import('@/lib/cache'), () => ({
  getAllUsersFromCache: vi.fn(() =>
    Promise.resolve({
      'bcd@ssb.no': {
        displayName: 'Bob',
        userPrincipalName: 'bcd@ssb.no',
        email: 'bob@ssb.no',
        businessPhone: '11223344',
      },
    })
  ),
}))

const app = await createApp()

const SEEDED_STATISTIC = {
  shortname: 'helse',
  name: 'Helse og helsetjenester',
  name_en: 'Health and health services',
  main_language: 'nb',
  comment: 'statistikk over befolkningens helse og tjenestebruk',
  division_code: '104',
  yearly_reporting: true,
  status: 'IA',
  first_released_at: '1970-01-01T00:00:00.000Z',
}

const createdStatistics: Array<{ statisticId: number | null; shortname: string | null }> = []

function toStatisticResponseShape(statistic: StatisticDetails) {
  return {
    shortname: statistic.shortname,
    name: statistic.name,
    name_en: statistic.name_en,
    main_language: statistic.main_language,
    comment: statistic.comment,
    division_code: statistic.division?.code,
    yearly_reporting: statistic.yearly_reporting,
    status_code: statistic.status?.code,
    first_released_at: statistic.first_released_at,
  }
}

function toStatisticDbShape(statistic: StatisticWithShortname) {
  return {
    shortname: statistic.shortname.name,
    name: statistic.name,
    name_en: statistic.name_en,
    language: statistic.language,
    comment: statistic.comment,
    division_code: statistic.division_code,
    yearly_reporting: statistic.yearly_reporting,
    status: statistic.status,
    legacy_topic_codes: statistic.legacy_topic_codes,
    related_statistic_id: statistic.related_statistic_id,
    first_release: statistic.first_release?.toISOString(),
  }
}

afterAll(async () => {
  await cleanupCreatedStatistics(createdStatistics)
  await prisma.$disconnect()
})

describe('statisticsController integration', () => {
  test('GET /statistics returns a list of statistics', async () => {
    const response = await request(app).get('/statistikkregisteret/api/statistics')

    expect(response.status).toBe(200)

    const statistics = response.body as StatisticListingResponse

    expect(Array.isArray(statistics.statistics)).toBe(true)
    expect(statistics.statistics?.length).toBeGreaterThan(0)

    const first = statistics.statistics?.[0]

    expect(first).toMatchObject({
      shortname: expect.any(String),
      name: expect.any(String),
      main_language: expect.any(String),
      status: {
        code: expect.any(String),
      },
    })
    expect(Array.isArray(first?.contacts)).toBe(true)
  })

  test('GET /statistics/:shortname returns statistic details', async () => {
    const response = await request(app).get(`/statistikkregisteret/api/statistics/${SEEDED_STATISTIC.shortname}`)

    expect(response.status).toBe(200)

    const statistic = response.body as StatisticDetails

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { status, ...statisticSeeded } = SEEDED_STATISTIC
    expect(toStatisticResponseShape(statistic)).toStrictEqual({ ...statisticSeeded, status_code: 'IA' })

    expect(Array.isArray(statistic.contacts)).toBe(true)
    expect(Array.isArray(statistic.variants)).toBe(true)

    if (statistic.contacts && statistic.contacts.length > 0) {
      expect(statistic.contacts[0]).toBeDefined()
    }
  })

  test('POST /statistics/:shortname creates a new statistic in the database', async () => {
    const createdShortnameName = await createTestShortname()

    const createPayload = {
      division: '101',
      name: 'Integration Test Created Statistic',
      name_en: 'Integration Test Created Statistic EN',
      first_released_at: '2024-01-01',
      main_language: 'nb',
      comment: 'Created by integration test',
    }

    const response = await request(app)
      .post(`/statistikkregisteret/api/statistics/${createdShortnameName}`)
      .set('content-type', 'application/json')
      .send(createPayload)

    expect(response.status).toBe(200)

    const statistic = response.body as StatisticDetails

    expect(toStatisticResponseShape(statistic)).toStrictEqual({
      shortname: createdShortnameName,
      name: createPayload.name,
      name_en: createPayload.name_en,
      main_language: createPayload.main_language,
      comment: createPayload.comment,
      division_code: createPayload.division,
      yearly_reporting: false,
      status_code: 'K',
      first_released_at: '2024-01-01T00:00:00.000Z',
    })

    const createdStatistic = await readStatisticFromDb(createdShortnameName)
    createdStatistics.push({
      statisticId: createdStatistic.id,
      shortname: createdShortnameName,
    })

    expect(toStatisticDbShape(createdStatistic)).toStrictEqual({
      shortname: createdShortnameName,
      name: createPayload.name,
      name_en: createPayload.name_en,
      language: createPayload.main_language,
      comment: createPayload.comment,
      division_code: createPayload.division,
      yearly_reporting: false,
      status: 'K',
      legacy_topic_codes: null,
      related_statistic_id: null,
      first_release: '2024-01-01T00:00:00.000Z',
    })
  })

  test('PUT /statistics/:shortname updates an existing statistic in the database', async () => {
    const createdShortnameName = await createTestShortname()

    const createPayload = {
      division: '101',
      name: 'Integration Test Statistic To Update',
      name_en: 'Integration Test Statistic To Update EN',
      first_released_at: '2024-01-01',
      main_language: 'nb',
      comment: 'Created for update integration test',
    }

    const createResponse = await request(app)
      .post(`/statistikkregisteret/api/statistics/${createdShortnameName}`)
      .set('content-type', 'application/json')
      .send(createPayload)

    expect(createResponse.status).toBe(200)

    const createdStatistic = await readStatisticFromDb(createdShortnameName)
    createdStatistics.push({
      statisticId: createdStatistic.id,
      shortname: createdShortnameName,
    })

    const updatePayload = {
      division: '101',
      statistic_region_levels: [],
      status: { code: 'IA' },
      name: 'Integration Test Statistic Updated',
      name_en: 'Integration Test Statistic Updated EN',
      relation: null,
      previous_topic_codes: '02.01.01',
      yearly_reporting: false,
      first_released_at: '2024-02-01',
      main_language: 'nn',
      comment: 'Updated by integration test',
    }

    const updateResponse = await request(app)
      .put(`/statistikkregisteret/api/statistics/${createdShortnameName}`)
      .set('content-type', 'application/json')
      .send(updatePayload)

    expect(updateResponse.status).toBe(200)

    const statistic = updateResponse.body as StatisticDetails

    expect(toStatisticResponseShape(statistic)).toStrictEqual({
      shortname: createdShortnameName,
      name: updatePayload.name,
      name_en: updatePayload.name_en,
      main_language: updatePayload.main_language,
      comment: updatePayload.comment,
      division_code: updatePayload.division,
      yearly_reporting: updatePayload.yearly_reporting,
      status_code: updatePayload.status.code,
      first_released_at: '2024-02-01T00:00:00.000Z',
    })

    const updatedStatistic = await readStatisticFromDb(createdShortnameName)

    expect(toStatisticDbShape(updatedStatistic)).toStrictEqual({
      shortname: createdShortnameName,
      name: updatePayload.name,
      name_en: updatePayload.name_en,
      language: updatePayload.main_language,
      comment: updatePayload.comment,
      division_code: updatePayload.division,
      yearly_reporting: updatePayload.yearly_reporting,
      status: updatePayload.status.code,
      legacy_topic_codes: updatePayload.previous_topic_codes,
      related_statistic_id: null,
      first_release: '2024-02-01T00:00:00.000Z',
    })
  })

  test('GET /statistics with shortname filter and sort', async () => {
    const response = await request(app)
      .get('/statistikkregisteret/api/statistics')
      .query('shortname=helse,energ&sort=-shortname')

    expect(response.status).toBe(200)

    const statistics = response.body as StatisticListingResponse

    expect(statistics.statistics?.length).toBe(2)
    expect(statistics.statistics?.[0]?.shortname).toBe('helse')
    expect(statistics.statistics?.[1]?.shortname).toBe('energ')
  })

  test('GET /statistics with contact filter and sort', async () => {
    const response = await request(app).get('/statistikkregisteret/api/statistics').query('contact=abc&sort=shortname')

    expect(response.status).toBe(200)

    const statistics = response.body as StatisticListingResponse

    expect(statistics.statistics?.length).toBe(2)
    expect(statistics.statistics?.[0]?.shortname).toBe('energ')
    expect(statistics.statistics?.[1]?.shortname).toBe('kpi')
  })
})
