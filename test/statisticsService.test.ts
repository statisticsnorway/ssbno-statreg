import { describe, mock } from 'node:test'
// import assert from 'node:assert/strict'
import { getAllStatistics } from '../src/services/statisticsService'

describe('statisticService', async () => {
  const prismaMock: any = {
    statistic: {},
  }

  const statisticsListingMockResults = mock.method(
    prismaMock.statistic,
    'findManyMock',
    async () => mockStatisticFindManyFilteredResults
  )

  /* TODO: This function will only return:
    {
      shortname: '',
      main_language: '',
      status: [{ language_code: '', text: '' }],
      name: [{ language_code: '', text: '' }, { language_code: '', text: '' })],
      contacts: [{ username: '', email: '' }],
    }
    But maybe that's what we should be testing instead?
    How can we mock prisma w/o having to pass "prismaMock" into the controller then?
  */

  const statisticsListing = await getAllStatistics({ start: 0, count: 1 })
})

// Test input values; calls.arguments
// 1. Test start validation, undefined -> default?
// 2. Test count validation, undefined -> default?

//
// 3.

////////////// MOCK DATA ////////////////////////////////
const mockStatisticFindManyFilteredResults = [
  {
    language: 'nb',
    status: 'SA',
    name: 'Energiregnskap og energibalanse',
    name_en: 'Energy account and energy balance',
    shortname: {
      name: 'energ',
    },
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
    shortname: {
      name: 'befolk',
    },
    responsiblePersons: [
      {
        username: 'bcd',
        email: 'bob@ssb.no',
      },
    ],
  },
]
