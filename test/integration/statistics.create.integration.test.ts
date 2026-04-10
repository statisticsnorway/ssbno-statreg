import test from 'node:test'
import assert from 'node:assert/strict'
import { prisma } from '@/lib/prisma'
import type { ExtendedPrismaClient } from '@/lib/prisma'

const db = prisma as ExtendedPrismaClient

const baseUrl = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3000'
const availableShortname = process.env.TEST_AVAILABLE_SHORTNAME as string

test('POST /statistics/:shortname creates a statistic in the database', async () => {
  assert.ok(
    availableShortname,
    'TEST_AVAILABLE_SHORTNAME must be set to a seeded shortname that exists and is available'
  )

  const payload = {
    division: 320,
    name: 'Integration test statistic',
    name_en: 'Integration test statistic',
    first_released_at: '2024-01-01',
    main_language: 'nb',
    comment: 'created by integration test',
  }

  const res = await fetch(`${baseUrl}/statistics/${availableShortname}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const responseText = await res.text()

  assert.equal(res.status, 200, `Expected 200 but got ${res.status}. Response body: ${responseText}`)

  const created = await db.statistic.findFirst({
    where: {
      shortname: {
        name: availableShortname,
      },
    },
    select: {
      name: true,
      name_en: true,
      division_code: true,
      language: true,
      first_release: true,
      comment: true,
      shortname: {
        select: {
          name: true,
        },
      },
    },
  })

  assert.ok(created, 'Expected statistic row to exist in database')
  assert.equal(created?.shortname.name, availableShortname)
  assert.equal(created?.name, payload.name)
  assert.equal(created?.name_en, payload.name_en)
  assert.equal(created?.division_code, String(payload.division))
  assert.equal(created?.language, payload.main_language)
  assert.equal(created?.comment, payload.comment)

  const firstRelease = created?.first_release?.toISOString().slice(0, 10)
  assert.equal(firstRelease, payload.first_released_at)
})
