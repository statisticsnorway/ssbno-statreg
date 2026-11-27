import { afterEach, beforeEach, describe, test, expect, vi } from 'vitest'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { setTimeout } from 'node:timers/promises'
import { createImportBatchWriter } from '../src/scripts/create-import-batch-writer'
// import { parseDateOnly, parseOldOsloDateStringAsUTC } from '../src/scripts/import-data-to-postgres'

describe('createImportBatchWriter()', () => {
  type StatisticContact = { statistic_id: number; contact_id: number }

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test.each([
    { rows: 0, batchSizes: [] },
    { rows: 999, batchSizes: [999] },
    { rows: 1000, batchSizes: [1000] },
    { rows: 1001, batchSizes: [1000, 1] },
    { rows: 2000, batchSizes: [1000, 1000] },
    { rows: 2001, batchSizes: [1000, 1000, 1] },
    { rows: 10001, batchSizes: [...Array<number>(10).fill(1000), 1] },
  ])('imports $rows rows exactly once in order', async ({ rows, batchSizes }) => {
    const items = Array.from({ length: rows }, (_, index) => ({ statistikk_id: index + 1, kontakt_id: index + 2 }))

    const batches: StatisticContact[][] = []
    let activeWrites = 0
    let maxActiveWrites = 0

    const writer = createImportBatchWriter<StatisticContact>(
      'STATISTIKK_KONTAKTER.json',
      async (batch) => {
        activeWrites++
        maxActiveWrites = Math.max(maxActiveWrites, activeWrites)
        // Simulate an asynchronous database insert before reading the batch.
        await setTimeout(1)
        batches.push([...batch])
        activeWrites--
      },
      (raw) => ({ statistic_id: Number(raw.statistikk_id), contact_id: Number(raw.kontakt_id) })
    )
    await pipeline(Readable.from(items), writer)

    expect(batches.map((batch) => batch.length)).toEqual(batchSizes)
    expect(batches.flat()).toEqual(
      items.map((item) => ({ statistic_id: item.statistikk_id, contact_id: item.kontakt_id }))
    )
    expect(maxActiveWrites).toBe(rows === 0 ? 0 : 1)
    expect(activeWrites).toBe(0)
  })

  test.each([1, 2])('propagates an insert failure in batch %i', async (failingBatch) => {
    const items = Array.from({ length: 1001 }, (_, id) => ({ id }))
    const error = new Error('Database insert failed')
    const pushBatch = vi.fn(async () => {
      await setTimeout(1)
      if (pushBatch.mock.calls.length === failingBatch) throw error
    })

    const writer = createImportBatchWriter('STATISTIKK_KONTAKTER.json', pushBatch, (raw) => raw)
    await expect(pipeline(Readable.from(items), writer)).rejects.toBe(error)
    expect(pushBatch).toHaveBeenCalledTimes(failingBatch)
  })

  test('propagates a mapping error without flushing a partial batch', async () => {
    const error = new Error('Invalid row')
    const pushBatch = vi.fn(async () => {})
    const writer = createImportBatchWriter('STATISTIKK_KONTAKTER.json', pushBatch, () => {
      throw error
    })

    await expect(pipeline(Readable.from([{ id: 1 }]), writer)).rejects.toBe(error)
    expect(pushBatch).not.toHaveBeenCalled()
  })
})

// Date parser tests remain disabled because importing the CLI also starts the migration.
describe('parseOldOsloDateStringAsUTC()', () => {
  test('dummy test to be able to comment out all tests', () => {
    expect(true).toBeTruthy()
  })
  // describe('valid strings', () => {
  //   test('parses winter time (UTC+1) correctly', () => {
  //     // 12:00 Oslo winter = 11:00 UTC
  //     expect(parseOldOsloDateStringAsUTC('15.01.2026 12.00.00')).toStrictEqual(new Date('2026-01-15T11:00:00.000Z'))
  //   })

  //   test('parses summer time (UTC+2) correctly', () => {
  //     // 12:00 Oslo summer = 10:00 UTC
  //     expect(parseOldOsloDateStringAsUTC('15.07.2026 12.00.00')).toStrictEqual(new Date('2026-07-15T10:00:00.000Z'))
  //   })

  //   test('parses DST transition day (clocks spring forward 29. march 2026)', () => {
  //     // Before DST: 01:59 Oslo = 00:59 UTC (UTC+1)
  //     expect(parseOldOsloDateStringAsUTC('29.03.2026 01.59.00')).toStrictEqual(new Date('2026-03-29T00:59:00.000Z'))
  //     // After DST: 03:00 Oslo = 01:00 UTC (UTC+2)
  //     expect(parseOldOsloDateStringAsUTC('29.03.2026 03.00.00')).toStrictEqual(new Date('2026-03-29T01:00:00.000Z'))
  //   })

  //   test('parses DST transition day (clocks fall back 25. october 2026)', () => {
  //     // Before fallback: 02:00 Oslo = 00:00 UTC (UTC+2)
  //     expect(parseOldOsloDateStringAsUTC('25.10.2026 01.59.59')).toStrictEqual(new Date('2026-10-24T23:59:59.000Z'))
  //     // After fallback: 02:00 Oslo = 01:00 UTC (UTC+1)
  //     expect(parseOldOsloDateStringAsUTC('25.10.2026 03.00.00')).toStrictEqual(new Date('2026-10-25T02:00:00.000Z'))
  //   })

  //   test('ignores trailing content after seconds (e.g. milliseconds)', () => {
  //     expect(parseOldOsloDateStringAsUTC('15.01.2026 12.00.00,123456789')).toStrictEqual(
  //       new Date('2026-01-15T11:00:00.000Z')
  //     )
  //   })

  //   test('parses midnight correctly', () => {
  //     expect(parseOldOsloDateStringAsUTC('15.01.2026 00.00.00')).toStrictEqual(new Date('2026-01-14T23:00:00.000Z'))
  //   })
  // })

  // describe('invalid strings', () => {
  //   test('returns undefined for empty string', () => {
  //     expect(parseOldOsloDateStringAsUTC('')).toBeUndefined()
  //   })

  //   test('returns undefined for ISO format', () => {
  //     expect(parseOldOsloDateStringAsUTC('2026-01-15T12:00:00')).toBeUndefined()
  //   })

  //   test('returns undefined for wrong separator', () => {
  //     expect(parseOldOsloDateStringAsUTC('15/01/2026 12:00:00')).toBeUndefined()
  //   })

  //   test('returns undefined for partial match', () => {
  //     expect(parseOldOsloDateStringAsUTC('15.01.2026')).toBeUndefined()
  //   })
  // })
})

describe('parseDateOnly()', () => {
  test('dummy test to be able to comment out all tests', () => {
    expect(true).toBeTruthy()
  })
  // describe('valid strings', () => {
  //   test('returns UTC midnight for the provided date', () => {
  //     expect(parseDateOnly('15.01.2026 12.00.00')).toStrictEqual(new Date('2026-01-15T00:00:00.000Z'))
  //   })
  //   test('ignores time and always normalizes to midnight UTC', () => {
  //     expect(parseDateOnly('15.07.2026 23.59.59')).toStrictEqual(new Date('2026-07-15T00:00:00.000Z'))
  //   })
  //   test('ignores trailing content after seconds (e.g. milliseconds)', () => {
  //     expect(parseDateOnly('31.12.2027 00.00.00,000000000')).toStrictEqual(new Date('2027-12-31T00:00:00.000Z'))
  //   })
  // })
  // describe('invalid strings', () => {
  //   test('returns undefined for empty string', () => {
  //     expect(parseDateOnly('')).toBeUndefined()
  //   })
  //   test('returns undefined for ISO format', () => {
  //     expect(parseDateOnly('2026-01-15T12:00:00')).toBeUndefined()
  //   })
  //   test('returns undefined for wrong separator', () => {
  //     expect(parseDateOnly('15/01/2026 12:00:00')).toBeUndefined()
  //   })
  //   test('returns undefined for partial match', () => {
  //     expect(parseDateOnly('15.01.2026')).toBeUndefined()
  //   })
  // })
})
