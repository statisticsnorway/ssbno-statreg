import { vi, beforeEach, describe, expect, test } from 'vitest'

import { setUsersCache, getUsersFromCache, clearUsersCache } from '@/lib/cache'

const mockUsers = [
  {
    displayName: 'Ola Nordmann',
    email: 'ola.nordmann@ssb.no',
    businessPhone: null,
  },
  {
    displayName: 'Infotjenesten',
    email: 'infotjenesten@ssb.no',
    businessPhone: '11223344',
  },
]

const { fetchAllUsers, getAccessTokenMock } = vi.hoisted(() => ({
  fetchAllUsers: vi.fn(async () => Promise.resolve(mockUsers)),
  getAccessTokenMock: vi.fn(() => Promise.resolve('token')),
}))

vi.mock(import('../plugins/entraReaderClient'), async (importOriginal) => {
  const original = await importOriginal<typeof import('../plugins/entraReaderClient')>()
  return {
    ...original,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchAllUsers: fetchAllUsers as any,
    getAccessToken: getAccessTokenMock,
  }
})

describe('Users cache', () => {
  beforeEach(() => {
    clearUsersCache()
    fetchAllUsers.mockClear()
  })

  test('return empty array on first cache miss and populate cache', async () => {
    await expect(getUsersFromCache()).resolves.toEqual([])
    await expect(getUsersFromCache()).resolves.toEqual(mockUsers)
  })

  test('store and return users', async () => {
    await expect(setUsersCache()).resolves.toBeUndefined()
    await expect(getUsersFromCache()).resolves.toEqual(mockUsers)
  })

  test('clear cached users', async () => {
    await setUsersCache()
    await expect(getUsersFromCache()).resolves.toEqual(mockUsers)

    clearUsersCache()

    await expect(getUsersFromCache()).resolves.toEqual([])
    await expect(getUsersFromCache()).resolves.toEqual(mockUsers)
  })
})
