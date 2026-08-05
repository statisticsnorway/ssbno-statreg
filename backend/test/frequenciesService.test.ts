import { vi, describe, test, expect, beforeEach } from 'vitest'
import { getFrequencies } from '@/services/frequenciesService'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prismaMock: any

describe('frequenciesService ', async () => {
  beforeEach(() => {
    prismaMock = {
      frequency: {
        findMany: vi.fn(() => Promise.resolve([{ name: 'Uke', code: 'U' }])),
      },
    }
  })

  describe('getFrequencies ', () => {
    test('returns mocked data', async () => {
      const result = await getFrequencies(prismaMock)

      expect(result).toStrictEqual([{ name: 'Uke', code: 'U' }])
    })
  })
})
