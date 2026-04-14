import { after, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import type { components } from '@/types/api-types'
import { prisma } from '@/lib/prisma'
import {
  cleanupCreatedStatisticAndShortname,
  createTestShortname,
  fetchJson,
  readStatisticFromDb,
} from 'test/integration/integrationUtils'

type StatisticDetailsResponse = components['schemas']['Statistic_details']

let createdShortnameName: string | null = null
let createdStatisticId: number | null = null

after(async () => {
  await cleanupCreatedStatisticAndShortname(createdStatisticId, createdShortnameName)
  await prisma.$disconnect()
})

describe('statisticsController integration', () => {
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
})
