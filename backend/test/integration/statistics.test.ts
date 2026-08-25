import { describe, expect, test, vi } from 'vitest'
import { StatisticCreate, StatisticListingResponse, StatisticUpdate } from '@ssbno-statreg/shared'
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
    const createResponse = await request(app)
      .post(`/statistikkregisteret/api/statistics/${newShortname}`)
      .set('content-type', 'application/json')
      .send(createPayload)

    expect(createResponse.status).toBe(200)
    expect(createResponse.body).toMatchObject({
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

    // GET /statistics with shortname filter to verify persistence
    const listingResponse = await request(app)
      .get('/statistikkregisteret/api/statistics')
      .query(`shortname=${newShortname}`)
    expect(listingResponse.status).toBe(200)
    expect(listingResponse.body).toMatchObject({
      total: 1,
      statistics: [{ shortname: 'upcoming_test' }],
    })

    // GET /statistics/:shortname/versions to check that create event is registered in auditlog
    const versionsResponse = await request(app).get(`/statistikkregisteret/api/statistics/${newShortname}/versions`)
    expect(versionsResponse.status).toBe(200)
    expect(versionsResponse.body).toHaveLength(1)
    expect(versionsResponse.body[0].change_type).toBe('create')
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

    const createResponse = await request(app)
      .post(`/statistikkregisteret/api/statistics/${newShortname}`)
      .set('content-type', 'application/json')
      .send(createPayload)

    expect(createResponse.status).toBe(200)
    expect(createResponse.body).toMatchObject({
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

    // GET /statistics with shortname filter to verify persistence
    const listingResponse = await request(app)
      .get('/statistikkregisteret/api/statistics')
      .query(`shortname=${newShortname}`)
    expect(listingResponse.status).toBe(200)
    expect(listingResponse.body).toMatchObject({
      total: 1,
      statistics: [{ shortname: 'active_test' }],
    })

    // GET /statistics/:shortname/versions to check that create event is registered in auditlog
    const versionsResponse = await request(app).get(`/statistikkregisteret/api/statistics/${newShortname}/versions`)
    expect(versionsResponse.status).toBe(200)
    expect(versionsResponse.body).toHaveLength(1)
    expect(versionsResponse.body[0].change_type).toBe('create')
  })

  test('updates a statistic', async () => {
    const newShortname = 'update_test'

    // POST /shortnames
    const shortnameResponse = await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: newShortname })
    expect(shortnameResponse.status).toBe(201)

    // POST /statistics
    const createResponse = await request(app)
      .post(`/statistikkregisteret/api/statistics/${newShortname}`)
      .set('content-type', 'application/json')
      .send({
        status: { code: 'K' },
        division: '101',
        name: 'Statistikk for oppdateringstest',
        statistic_region_levels: [{ code: 'K' }],
      })
    expect(createResponse.status).toBe(200)

    // PUT /statistics and assert response
    const updatePayload: StatisticUpdate = {
      division: '101',
      statistic_region_levels: [{ code: 'F' }],
      status: { code: 'K' },
      name: 'Oppdatert statistikk',
      name_en: 'Updated statistic',
      relation_id: null,
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
      name_en: 'Updated statistic',
      previous_topic_codes: '',
      yearly_reporting: false,
      first_released_at: '2024-02-01T00:00:00.000Z',
      main_language: 'nn',
      comment: 'Kommentar',
    })

    // GET /statistics with shortname filter to verify persistence
    const listingResponse = await request(app)
      .get('/statistikkregisteret/api/statistics')
      .query(`shortname=${newShortname}`)
    expect(listingResponse.status).toBe(200)
    expect(listingResponse.body).toMatchObject({
      total: 1,
      statistics: [{ shortname: 'update_test', name: 'Oppdatert statistikk' }],
    })

    // GET /statistics/:shortname/versions to check that update event is registered in auditlog
    const versionsResponse = await request(app).get(`/statistikkregisteret/api/statistics/${newShortname}/versions`)
    expect(versionsResponse.status).toBe(200)
    expect(versionsResponse.body).toHaveLength(2)
    expect(versionsResponse.body[0]).toMatchObject({
      change_type: 'update',
      comment: 'Kommentar',
      changed_by: expect.any(String),
      changed_at: expect.any(String),
      changed_values: expect.any(Array),
    })
    expect(versionsResponse.body[1].change_type).toBe('create')
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
    const listingResponse = await request(app)
      .get('/statistikkregisteret/api/statistics')
      .query(`shortname=${shortnameA},${shortnameB}&sort=-shortname`)
    expect(listingResponse.status).toBe(200)
    expect(listingResponse.body).toMatchObject({
      total: 2,
      statistics: [{ shortname: 'filter_b' }, { shortname: 'filter_a' }],
    })
  })

  test('sets new contacts for a statistic', async () => {
    const newShortname = 'contacts_test'

    // POST /shortnames
    const shortnameResponse = await request(app)
      .post('/statistikkregisteret/api/shortnames')
      .set('content-type', 'application/json')
      .send({ shortname: newShortname })
    expect(shortnameResponse.status).toBe(201)

    // POST /statistics without contacts
    const createResponse = await request(app)
      .post(`/statistikkregisteret/api/statistics/${newShortname}`)
      .set('content-type', 'application/json')
      .send({ status: { code: 'K' }, division: '101', name: 'Contact test', contacts: [] })
    expect(createResponse.status).toBe(200)

    // PUT /statistics/:shortname/contacts and assert response
    const updateContactsResponse = await request(app)
      .put(`/statistikkregisteret/api/statistics/${newShortname}/contacts`)
      .set('content-type', 'application/json')
      .send(['bcd@ssb.no'])
    expect(updateContactsResponse.status).toBe(200)
    expect(updateContactsResponse.body).toMatchObject([{ name: 'Bob', principalName: 'bcd@ssb.no' }])

    // GET /statistics/:shortname to test persistence of new contacts
    const getResponse = await request(app).get(`/statistikkregisteret/api/statistics/${newShortname}`)
    expect(getResponse.status).toBe(200)
    expect(getResponse.body).toMatchObject({ contacts: [{ name: 'Bob', principalName: 'bcd@ssb.no' }] })

    // GET /statistics with contact filter and assert that statistic is included
    const filterResponse = await request(app).get('/statistikkregisteret/api/statistics').query(`contact=bcd@ssb.no`)
    expect(filterResponse.status).toBe(200)
    const foundShortnames = (filterResponse.body as StatisticListingResponse).statistics?.map((s) => s.shortname)
    expect(foundShortnames).toContain('contacts_test')

    // GET /statistics/:shortname/versions to check auditlog persistence including contacts change
    const versionsResponse = await request(app).get(`/statistikkregisteret/api/statistics/${newShortname}/versions`)
    expect(versionsResponse.status).toBe(200)
    expect(versionsResponse.body).toHaveLength(2)
    expect(versionsResponse.body[0].change_type).toBe('update')
    expect(versionsResponse.body[0].changed_values).toEqual([
      {
        field_name: 'responsiblePersons',
        old_value: expect.not.stringContaining('bcd@ssb.no'),
        new_value: expect.stringContaining('bcd@ssb.no'),
      },
    ])
    expect(versionsResponse.body[1].change_type).toBe('create')
  })
})
