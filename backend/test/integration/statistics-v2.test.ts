import { describe, expect, test, vi } from 'vitest'
import { Contact, ShortnameListing, StatisticCreate, StatisticListingResponse } from '@ssbno-statreg/shared'
import { createApp } from '@/app'
import request from 'supertest'

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

  test('POST /statistics/:shortname creates a new upcoming statistic in the database', async () => {
    const newShortname = `it-stat-upcoming-${Date.now()}`

    // POST shortname
    const shortnameResponse = await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: newShortname })
    expect(shortnameResponse.status).toBe(201)

    // POST statistic and assert response
    const createPayload = {
      status: { code: 'K' },
      division: '101',
      name: 'Integration Test Created Statistic',
      first_released_at: '2024-01-01',
    }
    const response = await request(app)
      .post(`/statistikkregisteret/api/statistics/${newShortname}`)
      .set('content-type', 'application/json')
      .send(createPayload)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      shortname: newShortname,
      name: createPayload.name,
      name_en: '',
      main_language: 'nb',
      comment: `Create statistic with shortname: ${newShortname}`,
      division: { code: createPayload.division },
      yearly_reporting: false,
      status: { code: 'K' },
      first_released_at: '2024-01-01T00:00:00.000Z',
    })
  })

  test('POST /statistics/:shortname creates a new active statistic in the database', async () => {
    const newShortname = `it-stat-active-${Date.now()}`

    // POST shortname
    const shortnameResponse = await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: newShortname })
    expect(shortnameResponse.status).toBe(201)

    // POST statistic and assert response
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
          level_of_detail: {
            name: 'Detaljnivå',
            name_en: 'Level of detail',
          },
        },
      ],
    }

    const response = await request(app)
      .post(`/statistikkregisteret/api/statistics/${newShortname}`)
      .set('content-type', 'application/json')
      .send(createPayload)

    expect(response.status).toBe(200)

    expect(response.body).toMatchObject({
      shortname: newShortname,
      name: createPayload.name,
      name_en: createPayload.name_en,
      main_language: 'nb',
      comment: `Create statistic with shortname: ${newShortname}`,
      division: { code: createPayload.division },
      yearly_reporting: false,
      status: { code: 'A' },
      first_released_at: '2026-08-10T00:00:00.000Z',
    })

    expect(response.body.contacts).toStrictEqual([
      {
        name: 'Alice',
        principalName: 'abc@ssb.no',
      },
    ])
    expect(response.body.variants).toEqual([
      expect.objectContaining({
        cancelled: false,
        revision: { code: 'I' },
        frequency: {
          name: 'Uke (U)',
          code: 'U',
        },
        level_of_detail: {
          name: 'Detaljnivå',
          name_en: 'Level of detail',
        },
      }),
    ])
  })

  test('PUT /statistics/:shortname updates an existing statistic in the database', async () => {
    const newShortname = `it-stat-update-${Date.now()}`

    // POST shortname
    const shortnameResponse = await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: newShortname })
    expect(shortnameResponse.status).toBe(201)

    // POST statistic
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
      .post(`/statistikkregisteret/api/statistics/${newShortname}`)
      .set('content-type', 'application/json')
      .send(createPayload)

    expect(createResponse.status).toBe(200)

    // PUT statistic and assert response
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
      .put(`/statistikkregisteret/api/statistics/${newShortname}`)
      .set('content-type', 'application/json')
      .send(updatePayload)

    expect(updateResponse.status).toBe(200)

    expect(updateResponse.body).toMatchObject({
      shortname: newShortname,
      name: updatePayload.name,
      name_en: updatePayload.name_en,
      main_language: updatePayload.main_language,
      comment: updatePayload.comment,
      division: { code: updatePayload.division },
      yearly_reporting: updatePayload.yearly_reporting,
      status: { code: updatePayload.status.code },
      first_released_at: '2024-02-01T00:00:00.000Z',
    })
  })

  test('GET /statistics with shortname filter and sort', async () => {
    // POST two shortnames and statistics to use in filter
    const shortnameA = `filter-test-a-${Date.now()}`
    const shortnameB = `filter-test-b-${Date.now()}`
    await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: shortnameA })
    await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: shortnameB })

    await request(app)
      .post(`/statistikkregisteret/api/statistics/${shortnameA}`)
      .set('content-type', 'application/json')
      .send({ status: { code: 'K' }, division: '101', name: 'Filter test A' })
    await request(app)
      .post(`/statistikkregisteret/api/statistics/${shortnameB}`)
      .set('content-type', 'application/json')
      .send({ status: { code: 'K' }, division: '101', name: 'Filter test B' })

    // GET statistics with shortname filter and sort, assert response
    const response = await request(app)
      .get('/statistikkregisteret/api/statistics')
      .query(`shortname=${shortnameA},${shortnameB}&sort=-shortname`)
    const statistics = response.body as StatisticListingResponse

    expect(response.status).toBe(200)
    expect(statistics.statistics?.length).toBe(2)
    expect(statistics.statistics?.[0]?.shortname).toBe(shortnameB)
    expect(statistics.statistics?.[1]?.shortname).toBe(shortnameA)
  })

  test('POST /statistic/:shortname/contacts and GET /statistics with contact filter', async () => {
    const shortname1 = `contact-filter-1-${Date.now()}`
    const shortname2 = `contact-filter-2-${Date.now()}`

    // POST two shortnames and statistics with the same contact
    await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: shortname1 })
    await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: shortname2 })

    await request(app)
      .post(`/statistikkregisteret/api/statistics/${shortname1}`)
      .set('content-type', 'application/json')
      .send({ status: { code: 'K' }, division: '101', name: 'Contact 1', contacts: ['abc@ssb.no'] })
    await request(app)
      .post(`/statistikkregisteret/api/statistics/${shortname2}`)
      .set('content-type', 'application/json')
      .send({ status: { code: 'K' }, division: '101', name: 'Contact 2', contacts: ['abc@ssb.no'] })

    // GET statistics with contact filter and assert that both statistics are included
    const response = await request(app).get('/statistikkregisteret/api/statistics').query(`contact=abc@ssb.no`)

    expect(response.status).toBe(200)

    const statistics = response.body as StatisticListingResponse

    expect(statistics.statistics?.length).toBeGreaterThanOrEqual(2)
    const shortnames = statistics.statistics?.map((s) => s.shortname)
    expect(shortnames).toContain(shortname1)
    expect(shortnames).toContain(shortname2)

    // Remove contact from one statistic
    await request(app)
      .put(`/statistikkregisteret/api/statistics/${shortname1}/contacts`)
      .set('content-type', 'application/json')
      .send([])

    // GET statistics with contact filter again and assert that only one statistic is included
    const responseAfterRemoval = await request(app).get('/statistikkregisteret/api/statistics').query(`contact=abc@ssb.no`)

    expect(responseAfterRemoval.status).toBe(200)

    const statisticsAfterRemoval = responseAfterRemoval.body as StatisticListingResponse
    const shortnamesAfterRemoval = statisticsAfterRemoval.statistics?.map((s) => s.shortname)
    expect(shortnamesAfterRemoval).not.toContain(shortname1)
    expect(shortnamesAfterRemoval).toContain(shortname2)
  })

  test('POST /shortnames creates a shortname that can be used to create and fetch a statistic', async () => {
    const newShortname = `it-stat-shortname-${Date.now()}`

    // POST shortname
    const shortnameResponse = await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: newShortname })

    expect(shortnameResponse.status).toBe(201)
    expect(shortnameResponse.body).toMatchObject({
      id: expect.any(Number),
      shortname: newShortname,
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
      .post(`/statistikkregisteret/api/statistics/${newShortname}`)
      .set('content-type', 'application/json')
      .send(createPayload)

    expect(createResponse.status).toBe(200)

    // GET statistic to test persistence
    const fetchResponse = await request(app).get(`/statistikkregisteret/api/statistics/${newShortname}`)
    expect(fetchResponse.status).toBe(200)
    expect(fetchResponse.body.shortname).toBe(newShortname)

    // GET shortnames to verify created shortname is listed
    const shortnamesListResponse = await request(app).get('/statistikkregisteret/api/shortnames')
    expect(shortnamesListResponse.status).toBe(200)
    expect(shortnamesListResponse.body.some((item: ShortnameListing) => item.shortname === newShortname)).toBe(true)
  })

  test('PUT /statistics/nytt_kortnavn/contacts sets new contacts for the statistic', async () => {
    // First create a statistic for this test
    const newShortname = `it-stat-contacts-${Date.now()}`

    const shortnameResponse = await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: newShortname })
    expect(shortnameResponse.status).toBe(201)

    const createPayload: StatisticCreate = {
      status: { code: 'K' },
      division: '101',
      name: 'Test contacts statistic',
      first_released_at: '2027-01-01',
    }

    const createResponse = await request(app)
      .post(`/statistikkregisteret/api/statistics/${newShortname}`)
      .set('content-type', 'application/json')
      .send(createPayload)
    expect(createResponse.status).toBe(200)

    // PUT contacts
    const contactsPayload = ['abc@ssb.no', 'bcd@ssb.no']

    const contactsResponse = await request(app)
      .put(`/statistikkregisteret/api/statistics/${newShortname}/contacts`)
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
    const fetchResponse = await request(app).get(`/statistikkregisteret/api/statistics/${newShortname}`)
    expect(fetchResponse.status).toBe(200)
    expect(fetchResponse.body.contacts).toHaveLength(2)
    expect(fetchResponse.body.contacts).toEqual(expect.arrayContaining(expectedContacts))
  })
})
