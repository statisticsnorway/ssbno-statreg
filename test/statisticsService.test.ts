import { describe, mock, test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { getAllStatistics } from '../src/services/statisticsService'

let prismaMock: any
let statisticsResult: object

function setStatisticsResult(next: object) {
  statisticsResult = next
}

// Test input values; calls.arguments
// 1. Test start validation, undefined -> default?
// 2. Test count validation, undefined -> default?
describe('statisticService', async () => {
  beforeEach(() => {
    prismaMock = {
      statistic: {
        findMany: mock.fn(() => Promise.resolve(statisticsResult)),
      },
    }
  })

  test('getAllStatistics returns mocked data', async () => {
    setStatisticsResult(mockStatistics)

    const result = await getAllStatistics({ start: 1, count: 2 }, prismaMock)

    assert.deepEqual(result, output)
    assert.equal(prismaMock.statistic.findMany.mock.calls[0].arguments[0]['skip'], 1)
    assert.equal(prismaMock.statistic.findMany.mock.calls[0].arguments[0]['take'], 2)
  })
})

////////////// MOCK DATA ////////////////////////////////
const mockStatistics = [
  {
    language: 'nb',
    status: 'SA',
    name: 'Energiregnskap og energibalanse',
    name_en: 'Energy account and energy balance',
    shortname: { name: 'energ' },
    responsiblePersons: [
      {
        username: 'abc',
        email: 'alice@ssb.no',
      },
    ],
  },
  {
    language: 'nb',
    status: 'SA',
    name: 'Befolkning og demografi',
    name_en: 'Population and demography',
    shortname: { name: 'befolk' },
    responsiblePersons: [
      {
        username: 'bcd',
        email: 'bob@ssb.no',
      },
    ],
  },
]

const output = [
  {
    shortname: 'energ',
    main_language: 'nb',
    status: [{ language_code: 'nb', text: 'SA' }],
    name: [
      { language_code: 'nb', text: 'Energiregnskap og energibalanse' },
      { language_code: 'en', text: 'Energy account and energy balance' },
    ],
    contacts: [{ username: 'abc', email: 'alice@ssb.no' }],
  },
  {
    shortname: 'befolk',
    main_language: 'nb',
    status: [{ language_code: 'nb', text: 'SA' }],
    name: [
      { language_code: 'nb', text: 'Befolkning og demografi' },
      { language_code: 'en', text: 'Population and demography' },
    ],
    contacts: [{ username: 'bcd', email: 'bob@ssb.no' }],
  },
]
