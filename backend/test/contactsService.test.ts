import { vi, describe, test, expect, beforeEach } from 'vitest'
import { getContacts } from '@/services/contactsService'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prismaMock: any

describe('contactsService ', async () => {
  beforeEach(() => {
    prismaMock = {
      responsiblePerson: {
        findMany: vi.fn(() => Promise.resolve([{ username: 'abc', email: 'alice@ssb.no', name: 'Navn Navnesen' }])),
      },
    }
  })

  describe('getContacts ', () => {
    test('returns mocked data', async () => {
      const result = await getContacts(prismaMock)

      expect(result).toStrictEqual([{ username: 'abc', email: 'alice@ssb.no', name: 'Navn Navnesen' }])
    })
  })
})
