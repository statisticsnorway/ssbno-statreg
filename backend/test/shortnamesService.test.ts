import { vi, describe, test, expect, beforeEach } from 'vitest'
import { getShortnames } from '@/services/shortnamesService'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prismaMock: any

describe('releasesService ', async () => {
  beforeEach(() => {
    prismaMock = {
      shortname: {
        findMany: vi.fn(() => Promise.resolve([{ name: 'kpi', statistic: { name: 'Konsumprisindeksen' } }])),
      },
    }
  })

  describe('getReleases ', () => {
    test('returns mocked data', async () => {
      const result = await getShortnames(prismaMock)

      expect(result).toStrictEqual([{ shortname: 'kpi', statistic_name: 'Konsumprisindeksen' }])
    })
  })
})
