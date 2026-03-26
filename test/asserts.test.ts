import { describe, test, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { assertStatisticExists, assertVariantExists, assertVariantMatchesShortname } from '@/lib/asserts'

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
    }
  })

  test('assertStatisticExists returns undefined when statistic exists', async () => {
    prismaMock.statistic.findFirst = mock.fn(() => Promise.resolve({ id: 1 }))

    const result = await assertStatisticExists('KPI', prismaMock)

    assert.equal(result, undefined)
    assert.equal(prismaMock.statistic.findFirst.mock.calls.length, 1)
    assert.deepEqual(prismaMock.statistic.findFirst.mock.calls[0].arguments[0], {
      where: { shortname: { name: 'KPI' } },
      select: { id: true },
    })
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
    assert.equal(prismaMock.variant.findUnique.mock.calls.length, 1)
    assert.deepEqual(prismaMock.variant.findUnique.mock.calls[0].arguments[0], {
      where: { id: 1 },
      select: { id: true },
    })
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
    assert.equal(prismaMock.variant.findFirst.mock.calls.length, 1)
    assert.deepEqual(prismaMock.variant.findFirst.mock.calls[0].arguments[0], {
      where: {
        id: 1,
        statistic: {
          shortname: {
            name: 'KPI',
          },
        },
      },
      select: { id: true },
    })
  })

  test('assertVariantMatchesShortname throws when variant does not belong to statistic', async () => {
    prismaMock.variant.findFirst = mock.fn(() => Promise.resolve(null))

    await assert.rejects(() => assertVariantMatchesShortname(1, 'KPI', prismaMock), {
      status: 404,
      statregError: "Variant does not belong to statistic 'KPI'",
    })
  })
})
