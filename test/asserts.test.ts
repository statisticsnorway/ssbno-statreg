import { describe, test, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import {
  assertDayNotManuallyBlocked,
  assertShortnameExists,
  assertShortnameExistsAndIsAvailable,
  assertStatisticExists,
  assertVariantExists,
  assertVariantMatchesShortname,
} from '@/lib/asserts'

let prismaMock: any

describe('asserts', () => {
  beforeEach(() => {
    prismaMock = {
      statistic: {
        findFirst: mock.fn(),
      },
      variant: {
        findUnique: mock.fn(),
        findFirst: mock.fn(),
      },
      shortname: {
        findUnique: mock.fn(),
      },
      calender_date: {
        findUnique: mock.fn(),
      },
    }
  })

  test('assertStatisticExists returns undefined when statistic exists', async () => {
    prismaMock.statistic.findFirst = mock.fn(() => Promise.resolve({ id: 1 }))

    const result = await assertStatisticExists('KPI', prismaMock)

    assert.equal(result, undefined)
  })

  test('assertStatisticExists throws when statistic does not exist', async () => {
    prismaMock.statistic.findFirst = mock.fn(() => Promise.resolve(null))

    await assert.rejects(() => assertStatisticExists('BAD', prismaMock), {
      status: 404,
      statregError: "Statistic 'BAD' not found",
    })
  })

  test('assertVariantExists returns undefined when variant exists', async () => {
    prismaMock.variant.findUnique = mock.fn(() => Promise.resolve({ id: 1 }))

    const result = await assertVariantExists(1, prismaMock)

    assert.equal(result, undefined)
  })

  test('assertVariantExists throws when variant does not exist', async () => {
    prismaMock.variant.findUnique = mock.fn(() => Promise.resolve(null))

    await assert.rejects(() => assertVariantExists(999, prismaMock), {
      status: 404,
      statregError: "Variant '999' not found",
    })
  })

  test('assertVariantMatchesShortname returns undefined when variant belongs to statistic', async () => {
    prismaMock.variant.findFirst = mock.fn(() => Promise.resolve({ id: 1 }))

    const result = await assertVariantMatchesShortname(1, 'KPI', prismaMock)

    assert.equal(result, undefined)
  })

  test('assertVariantMatchesShortname throws when variant does not belong to statistic', async () => {
    prismaMock.variant.findFirst = mock.fn(() => Promise.resolve(null))

    await assert.rejects(() => assertVariantMatchesShortname(1, 'KPI', prismaMock), {
      status: 404,
      statregError: "Variant does not belong to statistic 'KPI'",
    })
  })

  test('assertShortnameExists returns true when shortname exists', async () => {
    prismaMock.shortname.findUnique = mock.fn(() => Promise.resolve({ id: 1, name: 'KPI' }))

    const result = await assertShortnameExists('KPI', prismaMock)

    assert.equal(result, true)
  })

  test('assertShortnameExists throws when shortname does not exist', async () => {
    prismaMock.shortname.findUnique = mock.fn(() => Promise.resolve(null))

    await assert.rejects(() => assertShortnameExists('BAD', prismaMock), {
      status: 400,
      statregError: "Shortname 'BAD' does not exist",
    })
  })

  test('assertShortnameExistsAndIsAvailable returns true when shortname exists and is available', async () => {
    prismaMock.shortname.findUnique = mock.fn(() => Promise.resolve({ id: 1, name: 'KPI' }))

    const result = await assertShortnameExistsAndIsAvailable('KPI', prismaMock)

    assert.equal(result, true)
  })

  test('assertShortnameExistsAndIsAvailable throws when shortname is already in use', async () => {
    prismaMock.shortname.findUnique = mock.fn(() => Promise.resolve(null))

    await assert.rejects(() => assertShortnameExistsAndIsAvailable('KPI', prismaMock), {
      status: 400,
      statregError: "Shortname 'KPI' is already in use",
    })
  })

  describe('assertDayNotManuallyBlocked() ', () => {
    test('returns false when day is manually blocked', async () => {
      const blockedDay = new Date('2026-12-24T00:00:00Z')
      prismaMock.calender_date.findUnique = mock.fn(() => Promise.resolve({ comment: 'Julaften', day: blockedDay }))

      const result = await assertDayNotManuallyBlocked(prismaMock, blockedDay)

      assert.strictEqual(result, false)
    })

    test('returns true when day is not manually blocked', async () => {
      const unblockedDay = new Date('2026-12-01T00:00:00Z')
      prismaMock.calender_date.findUnique = mock.fn(() => Promise.resolve(null))

      const result = await assertDayNotManuallyBlocked(prismaMock, unblockedDay)

      assert.strictEqual(result, true)
    })
  })
})
