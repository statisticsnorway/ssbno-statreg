/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import {
  fetchAllUsers,
  getAccessToken,
  setCachedToken,
  setTokenExpiresAt,
  setTokenPromise,
} from '../plugins/entraReaderClient'

const TEST_EMAIL = 'admin@ssb.no'
const originalEnv = process.env
const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Promise.reject(null))

function mockTokenSuccess() {
  const body = { access_token: 'fake-token', expires_in: 3600 }
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  })
}

function mockGraphSuccess(data: object) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => data,
  })
}

function mockGraphFailure(status: number, message: string) {
  return Promise.resolve({
    ok: false,
    status,
    text: async () => message,
  })
}

function mockFetchError(status: number, message?: string) {
  return Promise.reject({
    ok: false,
    status,
    text: message,
  })
}

describe('entraReaderClient ', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ENTRA_READER_AZURE_TENANT_ID: 'tenant-id',
      ENTRA_READER_AZURE_CLIENT_ID: 'client-id',
      ENTRA_READER_AZURE_CLIENT_SECRET: 'client-secret',
    }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.resetAllMocks()
  })

  describe('getAccessToken ', async () => {
    beforeEach(() => {
      setCachedToken(null)
      setTokenExpiresAt(0)
      setTokenPromise(null)
    })
    test('returns null when required Entra env vars are missing', async () => {
      process.env = {}
      await expect(() => getAccessToken()).rejects.toMatchObject({
        message:
          'Missing Azure Entra configuration. Ensure AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET are set.',
      })
    })

    test('throws error if fetch from api fails', async () => {
      fetchMock.mockReturnValueOnce(mockFetchError(500, 'api error'))
      await expect(() => getAccessToken()).rejects.toMatchObject({
        status: 500,
        text: 'api error',
      })
    })

    test('returns fetched token if not cached', async () => {
      fetchMock.mockReturnValueOnce(mockTokenSuccess() as any)
      const result = await getAccessToken()
      expect(result).toBe('fake-token')
      expect(fetchMock).toHaveBeenCalledOnce()
    })

    test('returns cached token if it exists and is not expired', async () => {
      setCachedToken('cached token')
      setTokenExpiresAt(new Date().getTime() + 1000000)
      const result = await getAccessToken()
      expect(result).toBe('cached token')
      expect(fetchMock).toHaveBeenCalledTimes(0)
    })

    test('returns fetched token if cached token exists but is expired', async () => {
      setCachedToken('cached token')
      fetchMock.mockReturnValueOnce(mockTokenSuccess() as any)
      const result = await getAccessToken()
      expect(result).toBe('fake-token')
      expect(fetchMock).toHaveBeenCalledOnce()
    })

    test('returns existing token promise if already waiting', async () => {
      setTokenPromise(Promise.resolve('existing promise resolve'))
      fetchMock.mockReturnValueOnce(mockTokenSuccess() as any)
      const result = await getAccessToken()
      expect(result).toBe('existing promise resolve')
      expect(fetchMock).toHaveBeenCalledTimes(0)
    })
  })

  describe('fetchAllUsers ', async () => {
    test('throws error if missing token', async () => {
      expect(fetchMock).toHaveBeenCalledTimes(0)
      await expect(() => fetchAllUsers('')).rejects.toMatchObject({
        message: 'Missing token',
      })
    })

    test('returns all users from a single Graph response', async () => {
      fetchMock.mockReturnValueOnce(
        mockGraphSuccess({
          value: [
            {
              displayName: 'Admin SSB',
              businessPhones: ['123'],
              mail: TEST_EMAIL,
              userPrincipalName: 'admin@ssb.no',
            },
            {
              displayName: 'Infotjenesten',
              businessPhones: [],
              mail: null,
              userPrincipalName: 'infotjenesten@ssb.no',
            },
          ],
        }) as any
      )

      const users = await fetchAllUsers('token')

      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining(entraUsersResult.firstPageUrl),
        expect.anything()
      )
      expect(users).toStrictEqual([
        {
          displayName: 'Admin SSB',
          mail: TEST_EMAIL,
          userPrincipalName: 'admin@ssb.no',
          businessPhones: ['123'],
        },
        {
          displayName: 'Infotjenesten',
          mail: null,
          userPrincipalName: 'infotjenesten@ssb.no',
          businessPhones: [],
        },
      ])
    })

    test('follows @odata.nextLink and merges paged Graph responses', async () => {
      fetchMock
        .mockReturnValueOnce(
          mockGraphSuccess({
            value: [
              {
                displayName: 'Admin SSB',
                businessPhones: ['123'],
                mail: null,
                userPrincipalName: TEST_EMAIL,
              },
            ],
            '@odata.nextLink': entraUsersResult.nextPageUrl,
          }) as any
        )
        .mockReturnValueOnce(
          mockGraphSuccess({
            value: [
              {
                displayName: 'Infotjenesten',
                businessPhones: ['11223344'],
                mail: 'infotjenesten@ssb.no',
                userPrincipalName: 'infotjenesten@ssb.no',
              },
            ],
          }) as any
        )

      const users = await fetchAllUsers('token')

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining(entraUsersResult.firstPageUrl),
        expect.anything()
      )
      expect(fetchMock).toHaveBeenNthCalledWith(2, entraUsersResult.nextPageUrl, expect.anything())
      expect(users).toStrictEqual([
        {
          displayName: 'Admin SSB',
          mail: null,
          userPrincipalName: TEST_EMAIL,
          businessPhones: ['123'],
        },
        {
          displayName: 'Infotjenesten',
          mail: 'infotjenesten@ssb.no',
          userPrincipalName: 'infotjenesten@ssb.no',
          businessPhones: ['11223344'],
        },
      ])
    })

    test('throws error if Graph users request fails', async () => {
      fetchMock.mockReturnValueOnce(mockGraphFailure(500, 'api error') as any)

      await expect(() => fetchAllUsers('token')).rejects.toMatchObject({
        message: 'Graph users request failed: 500 api error',
      })

      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining(entraUsersResult.firstPageUrl),
        expect.anything()
      )
    })
  })
})

////////////// MOCK DATA ////////////////////////////////

const entraUsersResult = {
  firstPageUrl: `/users?$filter=accountEnabled eq true and userType eq 'Member'&$select=displayName,businessPhones,mail,userPrincipalName&$top=999`,
  nextPageUrl: '/users?$skiptoken=next-page-token',
}
