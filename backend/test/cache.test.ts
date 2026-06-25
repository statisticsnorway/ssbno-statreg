import { vi, afterAll, beforeEach, describe, expect, test } from 'vitest'

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

const mockedEntraUsers = [
  {
    displayName: 'Admin SSB',
    email: 'admin.ssb@ssb.no',
    businessPhone: null,
  },
]

const originalMockEntraUsers = process.env.MOCK_ENTRA_USERS

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
    getAccessTokenMock.mockClear()
    delete process.env.MOCK_ENTRA_USERS
  })

  afterAll(() => {
    if (originalMockEntraUsers === undefined) {
      delete process.env.MOCK_ENTRA_USERS
      return
    }

    process.env.MOCK_ENTRA_USERS = originalMockEntraUsers
  })

  test('return fetched users on first cache miss and reuse cached users', async () => {
    await expect(getUsersFromCache()).resolves.toEqual(mockUsers)

    expect(getAccessTokenMock).toHaveBeenCalledTimes(1)
    expect(fetchAllUsers).toHaveBeenCalledTimes(1)

    await expect(getUsersFromCache()).resolves.toEqual(mockUsers)

    expect(getAccessTokenMock).toHaveBeenCalledTimes(1)
    expect(fetchAllUsers).toHaveBeenCalledTimes(1)
  })

  test('store and return users', async () => {
    await expect(setUsersCache()).resolves.toBeUndefined()

    await expect(getUsersFromCache()).resolves.toEqual(mockUsers)

    expect(getAccessTokenMock).toHaveBeenCalledTimes(1)
    expect(fetchAllUsers).toHaveBeenCalledTimes(1)
  })

  test('clear cached users', async () => {
    await setUsersCache()
    await expect(getUsersFromCache()).resolves.toEqual(mockUsers)

    clearUsersCache()

    await expect(getUsersFromCache()).resolves.toEqual(mockUsers)

    expect(getAccessTokenMock).toHaveBeenCalledTimes(2)
    expect(fetchAllUsers).toHaveBeenCalledTimes(2)
  })

  test('return empty array when no access token is available', async () => {
    // @ts-expect-error: Mocking the getAccessToken function to return undefined for testing purposes
    getAccessTokenMock.mockResolvedValueOnce(undefined)

    await expect(getUsersFromCache()).resolves.toEqual([])

    expect(getAccessTokenMock).toHaveBeenCalledTimes(1)
    expect(fetchAllUsers).toHaveBeenCalledTimes(0)
  })

  test('use mock users when MOCK_ENTRA_USERS is true', async () => {
    process.env.MOCK_ENTRA_USERS = 'true'

    await expect(getUsersFromCache()).resolves.toEqual(mockedEntraUsers)

    expect(getAccessTokenMock).toHaveBeenCalledTimes(0)
    expect(fetchAllUsers).toHaveBeenCalledTimes(0)
  })
})
