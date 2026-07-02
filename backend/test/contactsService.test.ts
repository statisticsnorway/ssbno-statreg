import { vi, beforeEach, describe, test, expect } from 'vitest'
import { getContacts } from '@/services/contactsService'

const { getAllUsersFromCacheMock } = vi.hoisted(() => ({
  getAllUsersFromCacheMock: vi.fn(),
}))

vi.mock(import('@/lib/cache'), async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/cache')>()
  return {
    ...original,
    getAllUsersFromCache: getAllUsersFromCacheMock,
  }
})

describe('contactsService', () => {
  describe('getContacts', () => {
    beforeEach(() => {
      getAllUsersFromCacheMock.mockReset()
    })

    test('returns mocked data', async () => {
      getAllUsersFromCacheMock.mockResolvedValueOnce({
        'bcd@ssb.no': {
          displayName: 'Bob',
          userPrincipalName: 'bcd@ssb.no',
          mail: 'bob@ssb.no',
          businessPhones: ['11223344'],
        },
        'admin@ssb.no': {
          displayName: 'Admin SSB',
          mail: 'admin.ssb@ssb.no',
          userPrincipalName: 'admin@ssb.no',
          businessPhones: null,
        },
      })

      const result = await getContacts()

      expect(getAllUsersFromCacheMock).toHaveBeenCalledTimes(1)
      expect(result).toStrictEqual([
        { principalName: 'bcd', name: 'Bob' },
        { principalName: 'admin', name: 'Admin SSB' },
      ])
    })

    test('returns empty array when cache has no users', async () => {
      getAllUsersFromCacheMock.mockResolvedValueOnce({})

      const result = await getContacts()

      expect(getAllUsersFromCacheMock).toHaveBeenCalledTimes(1)
      expect(result).toStrictEqual([])
    })
  })
})
