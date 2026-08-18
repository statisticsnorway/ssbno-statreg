import { describe, expect, test, vi } from 'vitest'
import { Contact, StatisticCreate, StatisticListingResponse, StatisticUpdate } from '@ssbno-statreg/shared'
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

describe('statistics controller', () => {
  test('lists statistics', async () => {
    // GET /statistics and assert response
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

  test('creates a new upcoming statistic', async () => {
    const newShortname = 'upcoming_test'

    // POST /shortname
    const shortnameResponse = await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: newShortname })
    expect(shortnameResponse.status).toBe(201)

    // POST /statistics and assert response
    const createPayload = {
      status: { code: 'K' },
      division: '101',
      name: 'Teststatistikk for opprettelse av kommende statistikk',
      first_released_at: '2024-01-01',
    }
    const response = await request(app)
      .post(`/statistikkregisteret/api/statistics/${newShortname}`)
      .set('content-type', 'application/json')
      .send(createPayload)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      shortname: 'upcoming_test',
      name: 'Teststatistikk for opprettelse av kommende statistikk',
      name_en: '',
      main_language: 'nb',
      comment: 'Create statistic with shortname: upcoming_test',
      division: { code: '101' },
      yearly_reporting: false,
      status: { code: 'K' },
      first_released_at: '2024-01-01T00:00:00.000Z',
    })
  })

  test('creates a new active statistic', async () => {
    const newShortname = 'active_test'

    // POST /shortnames
    const shortnameResponse = await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: newShortname })
    expect(shortnameResponse.status).toBe(201)

    // POST /statistics with contacts and variants and assert response
    const createPayload: StatisticCreate = {
      status: { code: 'A' },
      division: '101',
      name: 'Teststatistikk for opprettelse av aktiv statistikk',
      name_en: 'Test statistic for creation of active statistic',
      main_language: 'nb',
      first_released_at: '2026-08-10',
      contacts: ['bcd@ssb.no'],
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
      shortname: 'active_test',
      name: 'Teststatistikk for opprettelse av aktiv statistikk',
      name_en: 'Test statistic for creation of active statistic',
      main_language: 'nb',
      comment: 'Create statistic with shortname: active_test',
      division: { code: '101' },
      yearly_reporting: false,
      status: { code: 'A' },
      first_released_at: '2026-08-10T00:00:00.000Z',
      contacts: [{ name: 'Bob', principalName: 'bcd@ssb.no' }],
      variants: [
        {
          cancelled: false,
          revision: { code: 'I' },
          frequency: { name: 'Uke (U)', code: 'U' },
          level_of_detail: { name: 'Detaljnivå', name_en: 'Level of detail' },
        },
      ],
    })
  })

  test('updates an statistic', async () => {
    const newShortname = 'update_test'

    // POST /shortnames
    const shortnameResponse = await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: newShortname })
    expect(shortnameResponse.status).toBe(201)

    // POST /statistics
    const createPayload: StatisticCreate = {
      status: { code: 'K' },
      division: '101',
      name: 'Statistikk for oppdateringstest',
      statistic_region_levels: [{ code: 'K' }],
    }

    const createResponse = await request(app)
      .post(`/statistikkregisteret/api/statistics/${newShortname}`)
      .set('content-type', 'application/json')
      .send(createPayload)

    expect(createResponse.status).toBe(200)

    // PUT /statistics and assert response
    const updatePayload: StatisticUpdate = {
      division: '101',
      statistic_region_levels: [{ code: 'F' }],
      status: { code: 'K' },
      name: 'Oppdatert statistikk',
      name_en: 'Oppdatert statistikk',
      relation: null,
      previous_topic_codes: '',
      yearly_reporting: false,
      first_released_at: '2024-02-01',
      main_language: 'nn',
      comment: 'Kommentar',
    }

    const updateResponse = await request(app)
      .put(`/statistikkregisteret/api/statistics/${newShortname}`)
      .set('content-type', 'application/json')
      .send(updatePayload)

    expect(updateResponse.status).toBe(200)
    expect(updateResponse.body).toMatchObject({
      division: { code: '101' },
      statistic_region_levels: [{ code: 'F' }],
      status: { code: 'K' },
      name: 'Oppdatert statistikk',
      name_en: 'Oppdatert statistikk',
      previous_topic_codes: '',
      yearly_reporting: false,
      first_released_at: '2024-02-01T00:00:00.000Z',
      main_language: 'nn',
      comment: 'Kommentar',
    })
  })

  test('lists statistics with shortname filter and sort', async () => {
    // POST /shortnames
    const shortnameA = 'filter_a'
    const shortnameB = 'filter_b'
    await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: shortnameA })
    await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: shortnameB })

    // POST /statistics
    await request(app)
      .post(`/statistikkregisteret/api/statistics/${shortnameA}`)
      .set('content-type', 'application/json')
      .send({ status: { code: 'K' }, division: '101', name: 'Filter test A' })
    await request(app)
      .post(`/statistikkregisteret/api/statistics/${shortnameB}`)
      .set('content-type', 'application/json')
      .send({ status: { code: 'K' }, division: '101', name: 'Filter test B' })

    // GET /statistics with shortname filter and sort, and assert response
    const response = await request(app)
      .get('/statistikkregisteret/api/statistics')
      .query(`shortname=${shortnameA},${shortnameB}&sort=-shortname`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      total: 2,
      statistics: [{ shortname: 'filter_b' }, { shortname: 'filter_a' }],
    })
  })

  test('lists statistics with contact filter', async () => {
    const newShortname = 'contact_filter'

    // POST /shortname
    await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: newShortname })

    // POST /statistics
    await request(app)
      .post(`/statistikkregisteret/api/statistics/${newShortname}`)
      .set('content-type', 'application/json')
      .send({ status: { code: 'K' }, division: '101', name: 'Contact test', contacts: ['bcd@ssb.no'] })

    // GET /statistics with contact filter and assert that statistic is included
    const response = await request(app).get('/statistikkregisteret/api/statistics').query(`contact=bcd@ssb.no`)

    expect(response.status).toBe(200)
    const foundShortnames = (response.body as StatisticListingResponse).statistics?.map((s) => s.shortname)
    expect(foundShortnames).toContain('contact_filter')

    // PUT /statistics/:shortname/contacts to remove contact from statistic
    await request(app)
      .put(`/statistikkregisteret/api/statistics/${newShortname}/contacts`)
      .set('content-type', 'application/json')
      .send([])

    // GET /statistics with contact filter and assert that statistic is no longer included
    const responseAfterRemoval = await request(app)
      .get('/statistikkregisteret/api/statistics')
      .query(`contact=bcd@ssb.no`)

    expect(responseAfterRemoval.status).toBe(200)
    const foundShortnamesAfterRemoval = (responseAfterRemoval.body as StatisticListingResponse).statistics?.map(
      (s) => s.shortname
    )
    expect(foundShortnamesAfterRemoval).not.toContain('contact_filter')
  })

  test('sets new contacts for a statistic', async () => {
    const newShortname = 'contacts_test'

    // POST /shortnames
    const shortnameResponse = await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: newShortname })
    expect(shortnameResponse.status).toBe(201)

    // POST /statistics
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

    // PUT /statistics/:shortname/contacts and assert response
    const contactsPayload = ['bcd@ssb.no']

    const contactsResponse = await request(app)
      .put(`/statistikkregisteret/api/statistics/${newShortname}/contacts`)
      .set('content-type', 'application/json')
      .send(contactsPayload)

    expect(contactsResponse.status).toBe(200)
    expect(contactsResponse.body).toMatchObject([{ name: 'Bob', principalName: 'bcd@ssb.no' }])

    // GET /statistics/:shortname to test persistence of new contacts
    const fetchResponse = await request(app).get(`/statistikkregisteret/api/statistics/${newShortname}`)
    expect(fetchResponse.status).toBe(200)
    expect(fetchResponse.body).toMatchObject({ contacts: [{ name: 'Bob', principalName: 'bcd@ssb.no' }] })
  })
})
