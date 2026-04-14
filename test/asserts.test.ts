import { vi, describe, test, expect, beforeEach } from 'vitest'
// TODO: change back to import from '@/lib/asserts'
import {
  assertShortnameExists,
  assertShortnameExistsAndIsAvailable,
  assertStatisticExists,
  assertVariantExists,
  assertVariantMatchesShortname,
} from '../src/lib/asserts'

let prismaMock: any

describe('asserts', () => {
  beforeEach(() => {
    prismaMock = {
      statistic: {
        findFirst: vi.fn(),
      },
      variant: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      shortname: {
        findUnique: vi.fn(),
      },
    }
  })

  test('assertStatisticExists returns undefined when statistic exists', async () => {
    prismaMock.statistic.findFirst = vi.fn(() => Promise.resolve({ id: 1 }))

    const result = await assertStatisticExists('KPI', prismaMock)

    expect(result, undefined)
  })

  test('assertStatisticExists throws when statistic does not exist', async () => {
    prismaMock.statistic.findFirst = vi.fn(() => Promise.resolve(null))

    await expect(() => assertStatisticExists('BAD', prismaMock)).rejects.toMatchObject({
      status: 404,
      statregError: "Statistic 'BAD' not found",
    })
  })

  test('assertVariantExists returns undefined when variant exists', async () => {
    prismaMock.variant.findUnique = vi.fn(() => Promise.resolve({ id: 1 }))

    const result = await assertVariantExists(1, prismaMock)

    expect(result, undefined)
  })

  test('assertVariantExists throws when variant does not exist', async () => {
    prismaMock.variant.findUnique = vi.fn(() => Promise.resolve(null))

    await expect(() => assertVariantExists(999 as any, prismaMock)).rejects.toMatchObject({
      status: 404,
      statregError: "Variant '999' not found",
    })
  })

  test('assertVariantMatchesShortname returns undefined when variant belongs to statistic', async () => {
    prismaMock.variant.findFirst = vi.fn(() => Promise.resolve({ id: 1 }))

    const result = await assertVariantMatchesShortname(1, 'KPI', prismaMock)

    expect(result, undefined)
  })

  test('assertVariantMatchesShortname throws when variant does not belong to statistic', async () => {
    prismaMock.variant.findFirst = vi.fn(() => Promise.resolve(null))

    await expect(() => assertVariantMatchesShortname(1, 'KPI', prismaMock)).rejects.toMatchObject({
      status: 404,
      statregError: "Variant does not belong to statistic 'KPI'",
    })
  })

  test('assertShortnameExists returns true when shortname exists', async () => {
    prismaMock.shortname.findUnique = vi.fn(() => Promise.resolve({ id: 1, name: 'KPI' }))

    const result = await assertShortnameExists('KPI', prismaMock)

    expect(result).toBe(true)
  })

  test('assertShortnameExists throws when shortname does not exist', async () => {
    prismaMock.shortname.findUnique = vi.fn(() => Promise.resolve(null))

    await expect(() => assertShortnameExists('BAD', prismaMock)).rejects.toMatchObject({
      status: 404,
      statregError: "Shortname 'BAD' does not exist",
    })
  })

  test('assertShortnameExistsAndIsAvailable returns true when shortname exists and is available', async () => {
    prismaMock.shortname.findUnique = vi.fn(() => Promise.resolve({ id: 1, name: 'KPI' }))

    const result = await assertShortnameExistsAndIsAvailable('KPI', prismaMock)

    expect(result).toBe(true)
  })

  test('assertShortnameExistsAndIsAvailable throws when shortname is already in use', async () => {
    prismaMock.shortname.findUnique = vi.fn(() => Promise.resolve(null))

    await expect(() => assertShortnameExistsAndIsAvailable('KPI', prismaMock)).rejects.toMatchObject({
      status: 400,
      statregError: "Shortname 'KPI' is already in use",
    })
  })
})
