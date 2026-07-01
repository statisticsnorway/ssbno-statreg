import { vi, describe, test, expect } from 'vitest'
import { getContacts } from '@/services/contactsService'

const { getAllUsersFromCacheMock } = vi.hoisted(() => ({
  getAllUsersFromCacheMock: vi.fn(async () => {
    return {
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
    }
  }),
}))

vi.mock(import('@/lib/cache'), async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/cache')>()
  return {
    ...original,
    getAllUsersFromCache: getAllUsersFromCacheMock,
  }
})

describe('contactsService ', async () => {
  describe('getContacts ', () => {
    test('returns mocked data', async () => {
      const result = await getContacts()

      expect(result).toStrictEqual([
        { principalName: 'bcd@ssb.no', name: 'Bob' },
        { principalName: 'admin@ssb.no', name: 'Admin SSB' },
      ])
    })
  })
})
