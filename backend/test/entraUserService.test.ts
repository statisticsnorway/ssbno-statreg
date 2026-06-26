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
  {
    displayName: 'Demo bruker',
    email: null,
    userPrincipalName: undefined,
    businessPhone: null,
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

    test('returns empty array when users array is empty', async () => {
      const result = await fetchUsers([])

      expect(result).toStrictEqual([])
      expect(getUsersFromCacheMock).toHaveBeenCalledTimes(0)
    })

    test('returns users matched by email and userPrincipalName', async () => {
      const usersInput = [
        { username: 'ola', email: 'ola.nordmann@ssb.no' },
        { username: null, email: 'infotjenesten@ssb.no' },
      ]

      const result = await fetchUsers(usersInput)

      expect(result).toHaveLength(2)
      expect(result).toStrictEqual([
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
      ])
      expect(getUsersFromCacheMock).toHaveBeenCalledOnce()
    })

    test('matches users case-insensitively', async () => {
      const result = await fetchUsers([{ username: 'ola', email: 'OLA.NORDMANN@SSB.NO' }])

      expect(result).toStrictEqual([
        {
          displayName: 'Ola Nordmann',
          email: 'ola.nordmann@ssb.no',
          userPrincipalName: 'ola@ssb.no',
          businessPhone: '11223344',
        },
      ])
    })

    test('returns empty array when no cached users match', async () => {
      const result = await fetchUsers([{ email: 'nonExisting@ssb.no', username: 'nonExisting' }])

      expect(result).toStrictEqual([])
    })

    test('returns empty array when cached users are empty', async () => {
      getUsersFromCacheMock.mockResolvedValueOnce([])

      const result = await fetchUsers([{ username: 'ola', email: 'ola.nordmann@ssb.no' }])

      expect(result).toStrictEqual([])
    })

    test('propagates cache lookup failures', async () => {
      getUsersFromCacheMock.mockRejectedValueOnce(new Error('cache unavailable'))

      await expect(fetchUsers([{ username: 'ola', email: 'ola.nordmann@ssb.no' }])).rejects.toThrow('cache unavailable')
    })
  })
})
