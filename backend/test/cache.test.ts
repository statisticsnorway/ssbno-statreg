import { vi, afterAll, beforeEach, describe, expect, test } from 'vitest'

import { setUsersCache, getAllUsersFromCache, clearUsersCache } from '@/lib/cache'

const mockUsers = [
  {
    displayName: 'Ola Nordmann',
    email: 'ola.nordmann@ssb.no',
    userPrincipalName: 'ola@ssb.no',
    businessPhone: null,
  },
  {
    displayName: 'Infotjenesten',
    email: null,
    userPrincipalName: 'infotjenesten@ssb.no',
    businessPhone: '11223344',
  },
]

const expectedCachedUsers = {
  'ola@ssb.no': {
    displayName: 'Ola Nordmann',
    email: 'ola.nordmann@ssb.no',
    userPrincipalName: 'ola@ssb.no',
    businessPhone: null,
  },
  'infotjenesten@ssb.no': {
    displayName: 'Infotjenesten',
    email: null,
    userPrincipalName: 'infotjenesten@ssb.no',
    businessPhone: '11223344',
  },
}

const mockedEntraUsers = {
  'admin@ssb.no': {
    displayName: 'Admin SSB',
    email: 'admin.ssb@ssb.no',
    userPrincipalName: 'admin@ssb.no',
    businessPhone: null,
  },
}

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
    const fetchedUsers = await getAllUsersFromCache()
    expect(fetchedUsers).toEqual(expectedCachedUsers)

    expect(getAccessTokenMock).toHaveBeenCalledTimes(1)
    expect(fetchAllUsers).toHaveBeenCalledTimes(1)

    getAccessTokenMock.mockClear()
    fetchAllUsers.mockClear()

    const cachedUsers = await getAllUsersFromCache()

    expect(getAccessTokenMock).toHaveBeenCalledTimes(0)
    expect(fetchAllUsers).toHaveBeenCalledTimes(0)
    expect(cachedUsers).toEqual(expectedCachedUsers)
  })

  test('store and return users', async () => {
    await setUsersCache()
    const getUsers = await getAllUsersFromCache()

    expect(getAccessTokenMock).toHaveBeenCalledTimes(1)
    expect(fetchAllUsers).toHaveBeenCalledTimes(1)
    expect(getUsers).toEqual(expectedCachedUsers)
  })

  test('clear cached users', async () => {
    await setUsersCache()
    const cachedUsers = await getAllUsersFromCache()
    expect(cachedUsers).toEqual(expectedCachedUsers)

    clearUsersCache()

    const reCachedUsers = await getAllUsersFromCache()

    expect(getAccessTokenMock).toHaveBeenCalledTimes(2)
    expect(fetchAllUsers).toHaveBeenCalledTimes(2)
    expect(reCachedUsers).toEqual(expectedCachedUsers)
  })

  test('return empty array when no access token is available', async () => {
    // @ts-expect-error: Mocking the getAccessToken function to return undefined for testing purposes
    getAccessTokenMock.mockResolvedValueOnce(undefined)

    const users = await getAllUsersFromCache()

    expect(getAccessTokenMock).toHaveBeenCalledTimes(1)
    expect(fetchAllUsers).toHaveBeenCalledTimes(0)
    expect(users).toEqual({})
  })

  test('return empty array and log error when access token lookup throws', async () => {
    getAccessTokenMock.mockRejectedValueOnce(new Error('entra unavailable'))

    const users = await getAllUsersFromCache()

    expect(getAccessTokenMock).toHaveBeenCalledTimes(1)
    expect(fetchAllUsers).toHaveBeenCalledTimes(0)
    expect(users).toEqual({})
  })

  test('return empty array and log error when fetching users throws', async () => {
    fetchAllUsers.mockRejectedValueOnce(new Error('graph unavailable'))

    const users = await getAllUsersFromCache()

    expect(getAccessTokenMock).toHaveBeenCalledTimes(1)
    expect(fetchAllUsers).toHaveBeenCalledTimes(1)
    expect(users).toEqual({})
  })

  test('use mock users when MOCK_ENTRA_USERS is true', async () => {
    process.env.MOCK_ENTRA_USERS = 'true'

    const users = await getAllUsersFromCache()

    expect(getAccessTokenMock).toHaveBeenCalledTimes(0)
    expect(fetchAllUsers).toHaveBeenCalledTimes(0)
    expect(users).toEqual(mockedEntraUsers)
  })
})
