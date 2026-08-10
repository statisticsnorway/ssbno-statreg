import { afterAll, describe, expect, test, vi } from 'vitest'
import {
  Contact,
  ShortnameListing,
  StatisticCreate,
  StatisticDetails,
  StatisticListingResponse,
} from '@ssbno-statreg/shared'
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
      'abc@ssb.no': {
        displayName: 'Alice',
        userPrincipalName: 'abc@ssb.no',
        mail: 'alice@ssb.no',
        businessPhones: null,
      },
      'bcd@ssb.no': {
        displayName: 'Bob',
        userPrincipalName: 'bcd@ssb.no',
        mail: 'bob@ssb.no',
        businessPhones: ['11223344'],
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

  test('POST /statistics/:shortname creates a new upcoming statistic in the database', async () => {
    const createdShortnameName = await createTestShortname()

    const createPayload = {
      status: { code: 'K' },
      division: '101',
      name: 'Integration Test Created Statistic',
      first_released_at: '2024-01-01',
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
      name_en: '',
      main_language: 'nb',
      comment: `Create statistic with shortname: ${createdShortnameName}`,
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
      name_en: null,
      language: 'nb',
      comment: `Create statistic with shortname: ${createdShortnameName}`,
      division_code: createPayload.division,
      yearly_reporting: false,
      status: 'K',
      legacy_topic_codes: null,
      related_statistic_id: null,
      first_release: '2024-01-01T00:00:00.000Z',
    })
  })

  test('POST /statistics/:shortname creates a new active statistic in the database', async () => {
    const createdShortnameName = await createTestShortname()

    const createPayload = {
      status: { code: 'A' },
      division: '101',
      name: 'Integrationstest for oppretting av statistikk',
      name_en: 'Integration Test Created Statistic',
      main_language: 'nb',
      first_released_at: '2026-08-10',
      contacts: ['abc@ssb.no'],
      variants: [
        {
          frequency: { code: 'U' },
          revision: { code: 'I' },
        },
      ],
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
      main_language: 'nb',
      comment: `Create statistic with shortname: ${createdShortnameName}`,
      division_code: createPayload.division,
      yearly_reporting: false,
      status_code: 'A',
      first_released_at: '2026-08-10T00:00:00.000Z',
    })

    expect(statistic.contacts).toStrictEqual([
      {
        name: 'Alice',
        principalName: 'abc@ssb.no',
      },
    ])
    expect(statistic.variants).toEqual([
      expect.objectContaining({
        cancelled: false,
        revision: { code: 'I' },
        frequency: {
          name: 'Uke (U)',
          code: 'U',
        },
        level_of_detail: {
          name: '',
          name_en: '',
        },
      }),
    ])

    const createdStatistic = await readStatisticFromDb(createdShortnameName)
    createdStatistics.push({
      statisticId: createdStatistic.id,
      shortname: createdShortnameName,
    })

    expect(toStatisticDbShape(createdStatistic)).toStrictEqual({
      shortname: createdShortnameName,
      name: createPayload.name,
      name_en: createPayload.name_en,
      language: 'nb',
      comment: `Create statistic with shortname: ${createdShortnameName}`,
      division_code: createPayload.division,
      yearly_reporting: false,
      status: 'A',
      legacy_topic_codes: null,
      related_statistic_id: null,
      first_release: '2026-08-10T00:00:00.000Z',
    })
  })

  test('PUT /statistics/:shortname updates an existing statistic in the database', async () => {
    const createdShortnameName = await createTestShortname()

    const createPayload = {
      status: { code: 'K' },
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
    const response = await request(app)
      .get('/statistikkregisteret/api/statistics')
      .query('contact=abc@ssb.no&sort=shortname')

    expect(response.status).toBe(200)

    const statistics = response.body as StatisticListingResponse

    expect(statistics.statistics?.length).toBe(3)
    expect(statistics.statistics?.[0]?.shortname).toBe('energ')
    expect(statistics.statistics?.[1]?.shortname).toContain('it-stat')
    expect(statistics.statistics?.[2]?.shortname).toBe('kpi')
  })

  test('POST /shortnames creates a shortname that can be used to create and fetch a statistic', async () => {
    // POST shortname
    const shortnameResponse = await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: 'nytt_kortnavn' })

    expect(shortnameResponse.status).toBe(201)
    expect(shortnameResponse.body).toMatchObject({
      id: expect.any(Number),
      shortname: 'nytt_kortnavn',
    })

    // POST statistic for created shortname
    const createPayload: StatisticCreate = {
      status: { code: 'K' },
      division: '101',
      name: 'Ny statistikk',
      name_en: 'New statistic',
      first_released_at: '2027-01-01',
      main_language: 'nb',
    }
    const createResponse = await request(app)
      .post('/statistikkregisteret/api/statistics/nytt_kortnavn')
      .set('content-type', 'application/json')
      .send(createPayload)

    expect(createResponse.status).toBe(200)

    // GET statistic to test persistence
    const fetchResponse = await request(app).get('/statistikkregisteret/api/statistics/nytt_kortnavn')
    expect(fetchResponse.status).toBe(200)
    expect(fetchResponse.body.shortname).toBe('nytt_kortnavn')

    // GET shortnames to verify created shortname is listed
    const shortnamesListResponse = await request(app).get('/statistikkregisteret/api/shortnames')
    expect(shortnamesListResponse.status).toBe(200)
    expect(shortnamesListResponse.body.some((item: ShortnameListing) => item.shortname === 'nytt_kortnavn')).toBe(true)
  })

  test('PUT /statistics/nytt_kortnavn/contacts sets new contacts for the statistic', async () => {
    // PUT statistics/nytt_kortnavn/contacts
    const contactsPayload = ['abc@ssb.no', 'bcd@ssb.no']

    const contactsResponse = await request(app)
      .put('/statistikkregisteret/api/statistics/nytt_kortnavn/contacts')
      .set('content-type', 'application/json')
      .send(contactsPayload)

    const expectedContacts: Contact[] = [
      { name: 'Alice', principalName: 'abc@ssb.no' },
      { name: 'Bob', principalName: 'bcd@ssb.no' },
    ]

    expect(contactsResponse.status).toBe(200)
    expect(contactsResponse.body).toHaveLength(2)
    expect(contactsResponse.body).toEqual(expect.arrayContaining(expectedContacts))

    // GET statistic to test persistence of new contacts
    const fetchResponse = await request(app).get('/statistikkregisteret/api/statistics/nytt_kortnavn')
    expect(fetchResponse.status).toBe(200)
    expect(fetchResponse.body.contacts).toHaveLength(2)
    expect(fetchResponse.body.contacts).toEqual(expect.arrayContaining(expectedContacts))
  })
})
