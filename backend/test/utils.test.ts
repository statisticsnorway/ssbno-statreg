import {
  dateToISOString,
  sanitize,
  parseDateOnly,
  parseDateISO,
  ensureString,
  ensureStringArray,
  parseId,
  ensureRequiredFieldsExists,
  isNumber,
  getDateOnlyAsString,
  parseHumanReadableMeasuringPeriod,
  formatMonthYear,
  formatDayMonthYear,
  getIsoWeekInfo,
} from '@/lib/utils'
import { describe, test, expect } from 'vitest'

describe('utils', () => {
  describe('dateToISOString ', () => {
    test('returns ISO string for valid date', () => {
      const date = new Date('2020-01-01T12:00:00Z')
      const result = dateToISOString(date)
      expect(result).toBe('2020-01-01T12:00:00.000Z')
    })

    test('returns undefined when date is null', () => {
      const result = dateToISOString(null)
      expect(result).toBeUndefined()
    })
  })

  describe('sanitize', () => {
    test('handles empty string', async () => {
      const result = sanitize('')
      expect(result).toBe('')
    })
    test('handles input that is not string', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = sanitize(Number(8) as any)
      expect(result).toBe('')
    })
    test('returning same string if all characters are legal', async () => {
      const input = 'Alt her er lovlige bokstaver inkl. ÆæÅ!/'
      const result = sanitize(input)
      expect(result).toBe(input)
    })
    test('removes illigal characters', async () => {
      const input = `Fjerner alle ulovlige tegn: é\\<>{}`
      const result = sanitize(input)
      expect(result).toBe('Fjerner alle ulovlige tegn: ')
    })
  })

  describe('parseDateOnly', () => {
    test('accepts and returns valid Date', () => {
      const result = parseDateOnly('2026-12-24')
      expect(result.toISOString()).toBe('2026-12-24T00:00:00.000Z')
    })

    test('returns 400 for date ISO format', async () => {
      await expect(() => parseDateOnly('2026-03-25T12:30:00Z')).toThrow({
        statregError: 'Invalid date format: 2026-03-25T12:30:00Z',
      })
    })

    test('returns 400 for invalid date string format', async () => {
      expect(() => parseDateOnly('24. des')).toThrow({
        statregError: 'Invalid date format: 24. des',
      })
    })

    test('returns 400 if date parsing fails', async () => {
      expect(() => parseDateOnly('9999-11-00')).toThrow({
        statregError: 'Invalid date format: 9999-11-00',
      })
    })
  })

  describe('parseDateISO ', () => {
    test('accepts and returns valid date ISO format with Z', () => {
      const result = parseDateISO('2026-03-25T12:30:00Z')
      expect(result.toISOString()).toBe('2026-03-25T12:30:00.000Z')
    })

    test('accepts and returns valid date ISO format with offset', () => {
      const result = parseDateISO('2026-03-25T12:30:00+01:00')
      expect(result.toISOString()).toBe('2026-03-25T11:30:00.000Z')
    })

    test('accepts and returns valid date ISO format with milliseconds', () => {
      const result = parseDateISO('2026-03-25T12:30:00.123Z')
      expect(result.toISOString()).toBe('2026-03-25T12:30:00.123Z')
    })

    test('returns 400 for missing date', () => {
      expect(() => parseDateISO(undefined)).toThrow({
        statregError: 'Invalid date format:',
      })
    })

    test('returns 400 for invalid date only format', () => {
      expect(() => parseDateISO('2026-03-25', 'publish_time')).toThrow({
        statregError: 'Invalid publish_time date format: 2026-03-25',
      })
    })

    test('returns 400 for invalid date with missing timezone', () => {
      expect(() => parseDateISO('2026-03-25T12:30:00')).toThrow({
        statregError: 'Invalid date format: 2026-03-25T12:30:00',
      })
    })

    test('returns 400 for invalid date with space instead of T', () => {
      expect(() => parseDateISO('2026-03-25 12:30:00Z')).toThrow({
        statregError: 'Invalid date format: 2026-03-25 12:30:00Z',
      })
    })

    test('returns 400 for invalid date if not colon in offset', () => {
      expect(() => parseDateISO('2026-03-25T12:30:00+0100')).toThrow({
        statregError: 'Invalid date format: 2026-03-25T12:30:00+0100',
      })
    })
  })

  describe('ensureString', () => {
    test('returns passed string', () => {
      const result = ensureString('value')
      expect(result).toBe('value')
    })

    test('returns first element if passed value is an array of string', () => {
      const result = ensureString(['value1', 'value2'])
      expect(result).toBe('value1')
    })

    test('returns empty string if string is undefined', () => {
      const result = ensureString(undefined)
      expect(result).toBe('')
    })
  })

  describe('ensureStringArray', () => {
    test('returns array of strings when passed a comma-separated string', () => {
      const result = ensureStringArray('value1,value2,value3')
      expect(result).toEqual(['value1', 'value2', 'value3'])
    })

    test('returns array of string when passed string', () => {
      const result = ensureStringArray('value1')
      expect(result).toEqual(['value1'])
    })

    test('returns empty array when passed a non-string value', () => {
      // @ts-expect-error testing non-string input
      const result = ensureStringArray([123])
      expect(result).toEqual([])
    })
  })

  describe('ensureIdIsNumber', () => {
    test('returns parsed number for valid string id', () => {
      const result = parseId('123')
      expect(result).toBe(123)
    })

    test('returns parsed number for valid number id', () => {
      const result = parseId(123)
      expect(result).toBe(123)
    })

    test('throws error for invalid numeric format', () => {
      expect(() => parseId('abc')).toThrow({ statregError: 'Invalid id format' })
    })

    test('throws error for negative number', () => {
      expect(() => parseId('-1', 'variant')).toThrow({ statregError: 'Invalid variant id format' })
    })
  })

  describe('ensureRequiredFieldsExists', () => {
    test('return body when all the required fields exists', () => {
      const requiredFields: (keyof { field_1: 'test'; field_2: null })[] = ['field_1', 'field_2']
      const body = {
        field_1: 'test',
        field_2: null,
      }
      expect(body).toBe(ensureRequiredFieldsExists(body, requiredFields))
    })

    test('return 400 when body is undefined', () => {
      const requiredFields = ['field_1', 'field_2']
      expect(() => ensureRequiredFieldsExists(undefined, requiredFields)).toThrow({
        statregError: 'Missing required field(s): field_1, field_2',
      })
    })

    test('return 400 when body object is empty', () => {
      const requiredFields = ['field_1', 'field_2']
      expect(() => ensureRequiredFieldsExists({}, requiredFields as never[])).toThrow({
        statregError: 'Missing required field(s): field_1, field_2',
      })
    })
  })

  describe('isNumber', () => {
    test('a number is a number', () => {
      expect(true).toBe(isNumber(42))
    })
    test('a string with a number is castable as number', () => {
      expect(true).toBe(isNumber('9000'))
    })
    test('a string of text is not a number', () => {
      expect(false).toBe(isNumber('text in a string'))
    })
  })

  describe('getDateOnlyAsString', () => {
    test('gets the correct datestring from date', () => {
      const dateString = getDateOnlyAsString(new Date('2026-05-05T00:00Z'))
      expect(dateString).toBe('2026-05-05')
    })
    test('returns iso date if given local date with offset', () => {
      const dateString = getDateOnlyAsString(new Date('2026-05-05T00:00+01:00'))
      expect(dateString).toBe('2026-05-04')
    })
  })

  describe('formatMonthYear', () => {
    test('returns capitalized month and year in Norwegian', () => {
      const result = formatMonthYear(new Date(Date.UTC(2026, 0, 15)))
      expect(result).toBe('Januar 2026')
    })

    test('returns correct month for mid-year date', () => {
      const result = formatMonthYear(new Date(Date.UTC(2023, 5, 30)))
      expect(result).toBe('Juni 2023')
    })
  })

  describe('formatDayMonthYear', () => {
    test('returns day, month and year in Norwegian', () => {
      const result = formatDayMonthYear(new Date(Date.UTC(2026, 0, 1)))
      expect(result).toBe('1. januar 2026')
    })

    test('returns correct format for end of year', () => {
      const result = formatDayMonthYear(new Date(Date.UTC(2024, 11, 25)))
      expect(result).toBe('25. desember 2024')
    })
  })

  describe('getIsoWeekInfo', () => {
    test('returns week and year for a regular week', () => {
      const result = getIsoWeekInfo(new Date(Date.UTC(2011, 11, 11)))
      expect(result).toEqual({ week: 49, year: 2011 })
    })

    test('returns ISO week-year for week 1 spanning year boundary', () => {
      const result = getIsoWeekInfo(new Date(Date.UTC(2025, 11, 29)))
      expect(result).toEqual({ week: 1, year: 2026 })
    })

    test('returns previous ISO year for 1st of january in week 52', () => {
      const result = getIsoWeekInfo(new Date(Date.UTC(2022, 11, 26)))
      expect(result).toEqual({ week: 52, year: 2022 })
    })
  })

  describe('parseHumanReadableMeasuringPeriod', () => {
    function toUtcDate(dateString: string): Date {
      const [day, month, year] = dateString.split('.')
      return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
    }

    type MeasuringPeriodScenario = {
      scenarioDescription: string
      frequencyCode: string
      periodFrom: string
      periodTo: string
      expected: string
    }

    const scenarios: MeasuringPeriodScenario[] = [
      {
        scenarioDescription: 'week period monday to sunday',
        frequencyCode: 'W',
        periodFrom: '05.12.2011',
        periodTo: '11.12.2011',
        expected: 'Uke 49 2011',
      },
      {
        scenarioDescription: 'month period full month',
        frequencyCode: 'M',
        periodFrom: '01.12.2011',
        periodTo: '31.12.2011',
        expected: 'Desember 2011',
      },
      {
        scenarioDescription: 'month measuring point',
        frequencyCode: 'M',
        periodFrom: '15.12.2011',
        periodTo: '15.12.2011',
        expected: '15. desember 2011',
      },
      {
        scenarioDescription: 'term period over two months',
        frequencyCode: 'T',
        periodFrom: '01.11.2011',
        periodTo: '31.12.2011',
        expected: '6. termin 2011',
      },
      {
        scenarioDescription: '1st quarter period',
        frequencyCode: 'K',
        periodFrom: '01.01.2011',
        periodTo: '31.03.2011',
        expected: '1. kvartal 2011',
      },
      {
        scenarioDescription: '2nd quarter period',
        frequencyCode: 'K',
        periodFrom: '01.04.2011',
        periodTo: '30.06.2011',
        expected: '2. kvartal 2011',
      },
      {
        scenarioDescription: '3rd quarter period',
        frequencyCode: 'K',
        periodFrom: '01.07.2011',
        periodTo: '30.09.2011',
        expected: '3. kvartal 2011',
      },
      {
        scenarioDescription: '4th quarter period',
        frequencyCode: 'K',
        periodFrom: '01.10.2011',
        periodTo: '31.12.2011',
        expected: '4. kvartal 2011',
      },
      {
        scenarioDescription: 'quarter measuring point',
        frequencyCode: 'K',
        periodFrom: '01.04.2011',
        periodTo: '01.04.2011',
        expected: '1. april 2011',
      },
      {
        scenarioDescription: 'half-year first half',
        frequencyCode: 'H',
        periodFrom: '01.01.2011',
        periodTo: '30.06.2011',
        expected: '1. halvår 2011',
      },
      {
        scenarioDescription: 'half-year second half',
        frequencyCode: 'H',
        periodFrom: '01.07.2011',
        periodTo: '31.12.2011',
        expected: '2. halvår 2011',
      },
      {
        scenarioDescription: 'calendar year',
        frequencyCode: 'Y',
        periodFrom: '01.01.2011',
        periodTo: '31.12.2011',
        expected: '2011',
      },
      {
        scenarioDescription: 'ie. school or hunting year over two years',
        frequencyCode: 'Y',
        periodFrom: '01.09.2010',
        periodTo: '31.03.2011',
        expected: '2010/2011',
      },
      {
        scenarioDescription: 'year counting point',
        frequencyCode: 'Y',
        periodFrom: '01.01.2011',
        periodTo: '01.01.2011',
        expected: 'Per 1. januar 2011',
      },
      {
        scenarioDescription: 'multi-year period',
        frequencyCode: 'Y',
        periodFrom: '01.01.2011',
        periodTo: '31.12.2014',
        expected: '2011/2014',
      },
      {
        scenarioDescription: 'every 2nd year',
        frequencyCode: '2Y',
        periodFrom: '01.01.2010',
        periodTo: '31.12.2011',
        expected: '2010-2011',
      },
      {
        scenarioDescription: 'every 3rd year',
        frequencyCode: '3Y',
        periodFrom: '01.01.2010',
        periodTo: '31.12.2012',
        expected: '2010-2012',
      },
      {
        scenarioDescription: 'every 4th year',
        frequencyCode: '4Y',
        periodFrom: '01.01.2010',
        periodTo: '31.12.2013',
        expected: '2010-2013',
      },
      {
        scenarioDescription: 'every 5th year',
        frequencyCode: '5Y',
        periodFrom: '01.01.2010',
        periodTo: '31.12.2014',
        expected: '2010-2014',
      },
      {
        scenarioDescription: 'year measuring point with month label',
        frequencyCode: 'Y',
        periodFrom: '01.10.2011',
        periodTo: '01.10.2011',
        expected: '1. oktober 2011',
      },
    ]

    test.each(scenarios)(
      'returns correct for: $scenarioDescription',
      ({ frequencyCode, periodFrom, periodTo, expected }: MeasuringPeriodScenario) => {
        expect(parseHumanReadableMeasuringPeriod(frequencyCode, toUtcDate(periodFrom), toUtcDate(periodTo))).toBe(
          expected
        )
      }
    )
  })
})
