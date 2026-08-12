import { describe, test, expect } from 'vitest'
// import { parseDateOnly, parseOldOsloDateStringAsUTC } from '../src/scripts/import-data-to-postgres'

// Tests for database migration util. Commented out since code uses not currently installed npm packages

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
