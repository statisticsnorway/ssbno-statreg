import { after, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import type { components } from '@/types/api-types'
import { prisma } from '@/lib/prisma'
import {
  cleanupCreatedStatisticAndShortname,
  createTestShortname,
  fetchJson,
  getSeededStatisticWithShortname,
  readStatisticFromDb,
} from 'test/integration/integrationUtils'

type StatisticDetailsResponse = components['schemas']['Statistic_details']
type StatisticListingResponse = components['schemas']['Statistic_listing'][]

let createdShortnameName: string | null = null
let createdStatisticId: number | null = null

after(async () => {
  await cleanupCreatedStatisticAndShortname(createdStatisticId, createdShortnameName)
  await prisma.$disconnect()
})

describe('statisticsController integration', () => {
  test('GET /statistics returns a list of statistics', async () => {
    const { response, body } = await fetchJson('/statistics')

    assert.equal(response.status, 200)

    const statistics = body as StatisticListingResponse

    assert.ok(Array.isArray(statistics), 'Expected response to be an array')
    assert.ok(statistics.length > 0, 'Expected at least one statistic')

    const first = statistics[0]
    assert.ok(first, 'Expected first statistic to exist')

    assert.equal(typeof first.shortname, 'string')
    assert.equal(typeof first.name, 'string')
    assert.equal(typeof first.main_language, 'string')
    assert.equal(typeof first.status?.code, 'string')
    assert.ok(Array.isArray(first.contacts), 'Expected contacts to be an array')
  })

  test('GET /statistics/:shortname returns statistic details', async () => {
    const seededStatistic = await getSeededStatisticWithShortname()

    const { response, body } = await fetchJson(`/statistics/${seededStatistic.shortname.name}`)

    assert.equal(response.status, 200)

    const statistic = body as StatisticDetailsResponse

    assert.equal(statistic.shortname, seededStatistic.shortname.name)
    assert.equal(statistic.name, seededStatistic.name)
    assert.equal(statistic.name_en, seededStatistic.name_en ?? '')
    assert.equal(statistic.main_language, seededStatistic.language)
    assert.equal(statistic.comment, seededStatistic.comment)
    assert.equal(statistic.division?.code, seededStatistic.division_code ?? undefined)
    assert.equal(statistic.yearly_reporting, seededStatistic.yearly_reporting)
    assert.equal(statistic.status?.code, seededStatistic.status)
    assert.ok(Array.isArray(statistic.contacts), 'Expected contacts to be an array')
    assert.ok(Array.isArray(statistic.variants), 'Expected variants to be an array')

    if (statistic.contacts && statistic.contacts.length > 0) {
      const firstContact = statistic.contacts[0]
      assert.ok(firstContact, 'Expected first contact to exist')

      assert.equal(firstContact.name, 'Bob')
      assert.equal(firstContact.email, 'bob@ssb.no')
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

    assert.equal(response.status, 200)

    const statistic = body as StatisticDetailsResponse

    assert.equal(statistic.shortname, createdShortnameName)
    assert.equal(statistic.name, createPayload.name)
    assert.equal(statistic.name_en, createPayload.name_en)
    assert.equal(statistic.main_language, createPayload.main_language)
    assert.equal(statistic.comment, createPayload.comment)
    assert.equal(statistic.division?.code, createPayload.division)
    assert.equal(statistic.yearly_reporting, false)
    assert.equal(statistic.status?.code, 'K')

    const createdStatistic = await readStatisticFromDb(createdShortnameName)
    createdStatisticId = createdStatistic.id

    assert.equal(createdStatistic.shortname.name, createdShortnameName)
    assert.equal(createdStatistic.name, createPayload.name)
    assert.equal(createdStatistic.name_en, createPayload.name_en)
    assert.equal(createdStatistic.language, createPayload.main_language)
    assert.equal(createdStatistic.comment, createPayload.comment)
    assert.equal(createdStatistic.division_code, createPayload.division)
    assert.equal(createdStatistic.yearly_reporting, false)
    assert.equal(createdStatistic.status, 'K')
    assert.ok(createdStatistic.first_release)
    assert.equal(createdStatistic.first_release.toISOString(), '2024-01-01T00:00:00.000Z')
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

    assert.equal(response.status, 200)

    const statistic = body as StatisticDetailsResponse

    assert.equal(statistic.shortname, seededStatistic.shortname.name)
    assert.equal(statistic.name, updatePayload.name)
    assert.equal(statistic.name_en, updatePayload.name_en)
    assert.equal(statistic.main_language, updatePayload.main_language)
    assert.equal(statistic.comment, updatePayload.comment)
    assert.equal(statistic.division?.code, updatePayload.division)
    assert.equal(statistic.yearly_reporting, updatePayload.yearly_reporting)
    assert.equal(statistic.status?.code, updatePayload.status.code)
    assert.equal(statistic.first_released_at, '2024-02-01T00:00:00.000Z')

    const updatedStatistic = await readStatisticFromDb(seededStatistic.shortname.name)

    assert.equal(updatedStatistic.shortname.name, seededStatistic.shortname.name)
    assert.equal(updatedStatistic.name, updatePayload.name)
    assert.equal(updatedStatistic.name_en, updatePayload.name_en)
    assert.equal(updatedStatistic.language, updatePayload.main_language)
    assert.equal(updatedStatistic.comment, updatePayload.comment)
    assert.equal(updatedStatistic.division_code, updatePayload.division)
    assert.equal(updatedStatistic.yearly_reporting, updatePayload.yearly_reporting)
    assert.equal(updatedStatistic.status, updatePayload.status.code)
    assert.equal(updatedStatistic.legacy_topic_codes, updatePayload.previous_topic_codes)
    assert.equal(updatedStatistic.related_statistic_id, null)
    assert.ok(updatedStatistic.first_release)
    assert.equal(updatedStatistic.first_release.toISOString(), '2024-02-01T00:00:00.000Z')
  })
})
