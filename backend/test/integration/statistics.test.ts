import { afterAll, describe, expect, test } from 'vitest'
import type { components } from '../../../shared/src/api-types.d.ts'
import { prisma } from '@/lib/prisma'
import {
  cleanupCreatedStatisticAndShortname,
  createTestShortname,
  fetchJson,
  getSeededStatisticWithShortname,
  readStatisticFromDb,
} from './integrationUtils'

type StatisticDetailsResponse = components['schemas']['Statistic_details']
type StatisticListingResponse = components['schemas']['Statistic_listing'][]

let createdShortnameName: string | null = null
let createdStatisticId: number | null = null

afterAll(async () => {
  await cleanupCreatedStatisticAndShortname(createdStatisticId, createdShortnameName)
  await prisma.$disconnect()
})

describe('statisticsController integration', () => {
  test('GET /statistics returns a list of statistics', async () => {
    const { response, body } = await fetchJson('/statistics')

    expect(response.status).toBe(200)

    const statistics = body as StatisticListingResponse

    expect(Array.isArray(statistics)).toBe(true)
    expect(statistics.length).toBeGreaterThan(0)

    const first = statistics[0]!

    expect(typeof first.shortname).toBe('string')
    expect(typeof first.name).toBe('string')
    expect(typeof first.main_language).toBe('string')
    expect(typeof first.status?.code).toBe('string')
    expect(Array.isArray(first.contacts)).toBe(true)
  })

  test('GET /statistics/:shortname returns statistic details', async () => {
    const seededStatistic = await getSeededStatisticWithShortname()

    const { response, body } = await fetchJson(`/statistics/${seededStatistic.shortname.name}`)

    expect(response.status).toBe(200)

    const statistic = body as StatisticDetailsResponse

    expect(statistic.shortname).toBe(seededStatistic.shortname.name)
    expect(statistic.name).toBe(seededStatistic.name)
    expect(statistic.name_en).toBe(seededStatistic.name_en ?? '')
    expect(statistic.main_language).toBe(seededStatistic.language)
    expect(statistic.comment).toBe(seededStatistic.comment)
    expect(statistic.division?.code).toBe(seededStatistic.division_code ?? undefined)
    expect(statistic.yearly_reporting).toBe(seededStatistic.yearly_reporting)
    expect(statistic.status?.code).toBe(seededStatistic.status)
    expect(Array.isArray(statistic.contacts)).toBe(true)
    expect(Array.isArray(statistic.variants)).toBe(true)

    if (statistic.contacts && statistic.contacts.length > 0) {
      const firstContact = statistic.contacts[0]!
      expect(firstContact).toBeDefined()
    }
  })

  test('POST /statistics/:shortname creates a new statistic in the database', async () => {
    createdShortnameName = await createTestShortname()

    const createPayload = {
      division: '101',
      name: 'Integration Test Created Statistic',
      name_en: 'Integration Test Created Statistic EN',
      first_released_at: '2024-01-01',
      main_language: 'nb',
      comment: 'Created by integration test',
    }

    const { response, body } = await fetchJson(`/statistics/${createdShortnameName}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(createPayload),
    })

    expect(response.status).toBe(200)

    const statistic = body as StatisticDetailsResponse

    expect(statistic.shortname).toBe(createdShortnameName)
    expect(statistic.name).toBe(createPayload.name)
    expect(statistic.name_en).toBe(createPayload.name_en)
    expect(statistic.main_language).toBe(createPayload.main_language)
    expect(statistic.comment).toBe(createPayload.comment)
    expect(statistic.division?.code).toBe(createPayload.division)
    expect(statistic.yearly_reporting).toBe(false)
    expect(statistic.status?.code).toBe('K')

    const createdStatistic = await readStatisticFromDb(createdShortnameName)
    createdStatisticId = createdStatistic.id

    expect(createdStatistic.shortname.name).toBe(createdShortnameName)
    expect(createdStatistic.name).toBe(createPayload.name)
    expect(createdStatistic.name_en).toBe(createPayload.name_en)
    expect(createdStatistic.language).toBe(createPayload.main_language)
    expect(createdStatistic.comment).toBe(createPayload.comment)
    expect(createdStatistic.division_code).toBe(createPayload.division)
    expect(createdStatistic.yearly_reporting).toBe(false)
    expect(createdStatistic.status).toBe('K')
    expect(createdStatistic.first_release).toBeTruthy()
    expect(createdStatistic.first_release?.toISOString()).toBe('2024-01-01T00:00:00.000Z')
  })

  test('PUT /statistics/:shortname updates an existing statistic in the database', async () => {
    const seededStatistic = await getSeededStatisticWithShortname()

    const updatePayload = {
      division: seededStatistic.division_code ?? '101',
      statistic_region_levels: [],
      status: { code: seededStatistic.status === 'A' ? 'IA' : 'A' },
      name: `${seededStatistic.name} Updated`,
      name_en: `${seededStatistic.name_en ?? seededStatistic.name} Updated`,
      relation: null,
      previous_topic_codes: seededStatistic.legacy_topic_codes ?? '99.99.99',
      yearly_reporting: !seededStatistic.yearly_reporting,
      first_released_at: '2024-02-01',
      main_language: seededStatistic.language === 'nn' ? 'nb' : 'nn',
      comment: 'Updated by integration test',
    }

    const { response, body } = await fetchJson(`/statistics/${seededStatistic.shortname.name}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    })

    expect(response.status).toBe(200)

    const statistic = body as StatisticDetailsResponse

    expect(statistic.shortname).toBe(seededStatistic.shortname.name)
    expect(statistic.name).toBe(updatePayload.name)
    expect(statistic.name_en).toBe(updatePayload.name_en)
    expect(statistic.main_language).toBe(updatePayload.main_language)
    expect(statistic.comment).toBe(updatePayload.comment)
    expect(statistic.division?.code).toBe(updatePayload.division)
    expect(statistic.yearly_reporting).toBe(updatePayload.yearly_reporting)
    expect(statistic.status?.code).toBe(updatePayload.status.code)
    expect(statistic.first_released_at).toBe('2024-02-01T00:00:00.000Z')

    const updatedStatistic = await readStatisticFromDb(seededStatistic.shortname.name)

    expect(updatedStatistic.shortname.name).toBe(seededStatistic.shortname.name)
    expect(updatedStatistic.name).toBe(updatePayload.name)
    expect(updatedStatistic.name_en).toBe(updatePayload.name_en)
    expect(updatedStatistic.language).toBe(updatePayload.main_language)
    expect(updatedStatistic.comment).toBe(updatePayload.comment)
    expect(updatedStatistic.division_code).toBe(updatePayload.division)
    expect(updatedStatistic.yearly_reporting).toBe(updatePayload.yearly_reporting)
    expect(updatedStatistic.status).toBe(updatePayload.status.code)
    expect(updatedStatistic.legacy_topic_codes).toBe(updatePayload.previous_topic_codes)
    expect(updatedStatistic.related_statistic_id).toBeNull()
    expect(updatedStatistic.first_release).toBeTruthy()
    expect(updatedStatistic.first_release?.toISOString()).toBe('2024-02-01T00:00:00.000Z')
  })
})
