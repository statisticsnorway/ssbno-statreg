import { vi, afterAll, beforeEach, describe, expect, test } from 'vitest'

import { setUsersCache, getAllUsersFromCache, clearUsersCache, indexUsersByPrincipalName } from '@/lib/cache'

const mockUsers = [
  {
    displayName: 'Ola Nordmann',
    mail: 'ola.nordmann@ssb.no',
    userPrincipalName: 'ola@ssb.no',
    businessPhones: null,
  },
  {
    displayName: 'Infotjenesten',
    mail: null,
    userPrincipalName: 'infotjenesten@ssb.no',
    businessPhones: ['11223344'],
  },
]

const expectedCachedUsers = {
  'ola@ssb.no': {
    displayName: 'Ola Nordmann',
    mail: 'ola.nordmann@ssb.no',
    userPrincipalName: 'ola@ssb.no',
    businessPhones: null,
  },
  'infotjenesten@ssb.no': {
    displayName: 'Infotjenesten',
    mail: null,
    userPrincipalName: 'infotjenesten@ssb.no',
    businessPhones: ['11223344'],
  },
}

const mockedEntraUsers = {
  'admin@ssb.no': {
    displayName: 'Admin SSB',
    mail: 'admin.ssb@ssb.no',
    userPrincipalName: 'admin@ssb.no',
    businessPhones: null,
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

describe('indexUsersByPrincipalName', () => {
  test('returns empty record for empty user list', () => {
    expect(indexUsersByPrincipalName([])).toEqual({})
  })

  test('indexes users by userPrincipalName', () => {
    expect(indexUsersByPrincipalName(mockUsers)).toEqual(expectedCachedUsers)
  })
})

describe('getAllUsersFromCache', () => {
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
    getAccessTokenMock.mockRejectedValueOnce(undefined)

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
