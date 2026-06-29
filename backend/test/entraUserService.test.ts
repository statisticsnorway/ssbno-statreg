import { vi, test, describe, expect, beforeEach } from 'vitest'
import { fetchUsers } from '@/services/entraUserService'

const cachedUsers = [
  {
    displayName: 'Ola Nordmann',
    email: 'ola.nordmann@ssb.no',
    userPrincipalName: 'ola@ssb.no',
    businessPhone: '11223344',
  },
  {
    displayName: 'Infotjenesten',
    email: null,
    userPrincipalName: 'infotjenesten@ssb.no',
    businessPhone: '11223344',
  },
]

const { getUsersFromCacheMock } = vi.hoisted(() => ({
  getUsersFromCacheMock: vi.fn(async () => Promise.resolve(cachedUsers)),
}))

vi.mock(import('@/lib/cache'), async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/cache')>()
  return {
    ...original,
    getUsersFromCache: getUsersFromCacheMock,
  }
})

describe('entraUserService ', () => {
  describe('fetchUsers ', () => {
    beforeEach(() => {
      getUsersFromCacheMock.mockClear()
      getUsersFromCacheMock.mockResolvedValue(cachedUsers)
    })

    test('returns user matched by userPrincipalName', async () => {
      const usersInput = [{ username: 'ola' }]

      const result = await fetchUsers(usersInput)

      expect(getUsersFromCacheMock).toHaveBeenCalledOnce()
      expect(result).toStrictEqual([cachedUsers[0]])
    })

    test('returns users matched by userPrincipalName', async () => {
      const usersInput = [{ username: 'ola' }, { username: 'infotjenesten' }]

      const result = await fetchUsers(usersInput)

      expect(getUsersFromCacheMock).toHaveBeenCalledOnce()
      expect(result).toStrictEqual(cachedUsers)
    })

    test('returns empty array when users array is empty', async () => {
      const result = await fetchUsers([])

      expect(getUsersFromCacheMock).toHaveBeenCalledTimes(0)
      expect(result).toStrictEqual([])
    })

    test('returns empty array when no cached users match', async () => {
      const result = await fetchUsers([{ username: 'nonExisting' }])

      expect(getUsersFromCacheMock).toHaveBeenCalledTimes(1)
      expect(result).toStrictEqual([])
    })

    test('returns empty array when cached users are empty', async () => {
      getUsersFromCacheMock.mockResolvedValueOnce([])

      const result = await fetchUsers([{ username: 'ola' }])

      expect(getUsersFromCacheMock).toHaveBeenCalledTimes(1)
      expect(result).toStrictEqual([])
    })
  })
})
