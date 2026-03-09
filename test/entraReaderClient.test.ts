import { describe, test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { setCachedToken, setTokenExpiresAt, setTokenPromise } from '../plugins/entraReaderClient'

const TEST_EMAIL = 'admin@ssb.no'

const originalEnv = process.env
let payload: any
let fetchMock: ReturnType<typeof mock.method>

function mockTokenSuccess() {
  const body = { access_token: 'fake-token', expires_in: 3600 }
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }
}

function mockGraphSuccess(data: object) {
  return {
    ok: true,
    status: 200,
    json: async () => data,
  }
}

function mockFetchError(status: number, message?: string) {
  return {
    ok: false,
    status,
    text: async () => message,
  }
}

describe('entraReaderClient ', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ENTRA_READER_AZURE_TENANT_ID: 'tenant-id',
      ENTRA_READER_AZURE_CLIENT_ID: 'client-id',
      ENTRA_READER_AZURE_CLIENT_SECRET: 'client-secret',
    }

    fetchMock = mock.method(globalThis as unknown as { fetch: typeof fetch }, 'fetch', async () => {
      return payload
    })
  })

  afterEach(() => {
    process.env = originalEnv
    mock.restoreAll()
  })

  describe('getAccessToken ', async () => {
    beforeEach(() => {
      setCachedToken(null)
      setTokenExpiresAt(0)
      setTokenPromise(null)
    })
    test('throws Error when required Entra env vars are missing', async () => {
      process.env = {}
      const { getAccessToken } = await import(`../plugins/entraReaderClient`)
      await assert.rejects(() => getAccessToken(), /Missing Azure Entra configuration/)
    })

    test('throws error if fetch from api fails', async () => {
      payload = mockFetchError(500, 'api error')
      const { getAccessToken } = await import(`../plugins/entraReaderClient`)
      await assert.rejects(() => getAccessToken(), /OAuth token request failed/)
    })

    test('returns fetched token if not cached', async () => {
      payload = mockTokenSuccess()
      const { getAccessToken } = await import(`../plugins/entraReaderClient`)
      const result = await getAccessToken()
      assert.equal(result, 'fake-token')
      assert.equal(fetchMock.mock.callCount(), 1)
    })

    test('returns cached token if it exists and is not expired', async () => {
      setCachedToken('cached token')
      setTokenExpiresAt(new Date().getTime() + 1000000)
      payload = null
      const { getAccessToken } = await import(`../plugins/entraReaderClient`)
      const result = await getAccessToken()
      assert.equal(result, 'cached token')
      assert.equal(fetchMock.mock.callCount(), 0)
    })

    test('returns fetched token if cached token exists and but is expired', async () => {
      setCachedToken('cached token')
      payload = mockTokenSuccess()
      const { getAccessToken } = await import(`../plugins/entraReaderClient`)
      const result = await getAccessToken()
      assert.equal(result, 'fake-token')
      assert.equal(fetchMock.mock.callCount(), 1)
    })

    test('returns existing token promise if already waiting', async () => {
      setTokenPromise(Promise.resolve('existing promise resolve'))
      payload = mockTokenSuccess
      const { getAccessToken } = await import(`../plugins/entraReaderClient`)
      const result = await getAccessToken()
      assert.equal(result, 'existing promise resolve')
      assert.equal(fetchMock.mock.callCount(), 0)
    })
  })

  describe('fetchUserByEmail ', async () => {
    test('returns null if email is missing', async () => {
      payload = null
      const { fetchUserByEmail } = await import(`../plugins/entraReaderClient`)
      const user = await fetchUserByEmail('', 'token')
      assert.equal(fetchMock.mock.callCount(), 0)
      assert.deepEqual(user, null)
    })

    test('throws error if missing token', async () => {
      payload = null
      const { fetchUserByEmail } = await import(`../plugins/entraReaderClient`)
      assert.equal(fetchMock.mock.callCount(), 0)
      await assert.rejects(() => fetchUserByEmail(TEST_EMAIL, ''), /Missing token/)
    })

    test('returns user from email', async () => {
      payload = mockGraphSuccess({
        displayName: 'Admin SSB',
        businessPhones: ['123'],
        mail: TEST_EMAIL,
        userPrincipalName: '',
      })
      const { fetchUserByEmail } = await import(`../plugins/entraReaderClient`)
      const user = await fetchUserByEmail(TEST_EMAIL, 'token')
      assert.equal(
        fetchMock.mock.calls[0]?.arguments[0],
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(TEST_EMAIL)}?$select=displayName,businessPhones,mail,userPrincipalName`
      )
      assert.deepEqual(user, entraUserResult.user)
    })

    test('returns null when Graph returns 404', async () => {
      payload = mockFetchError(404, 'user not found')
      const { fetchUserByEmail } = await import(`../plugins/entraReaderClient`)
      const user = await fetchUserByEmail('NonExistingUser', 'token')
      assert.equal(
        fetchMock.mock.calls[0]?.arguments[0],
        `https://graph.microsoft.com/v1.0/users/NonExistingUser?$select=displayName,businessPhones,mail,userPrincipalName`
      )
      assert.equal(user, null)
    })

    test('throws error if fetch from api fails', async () => {
      payload = mockFetchError(500, 'api error')
      const { fetchUserByEmail } = await import(`../plugins/entraReaderClient`)
      await assert.rejects(() => fetchUserByEmail('admin', 'token'), /Error: Graph request failed: 500 api error/)
    })

    test('returns correct user format if only displayname returned', async () => {
      payload = mockGraphSuccess({
        displayName: 'Admin SSB',
      })
      const { fetchUserByEmail } = await import(`../plugins/entraReaderClient`)
      const user = await fetchUserByEmail(TEST_EMAIL, 'token')
      assert.equal(
        fetchMock.mock.calls[0]?.arguments[0],
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(TEST_EMAIL)}?$select=displayName,businessPhones,mail,userPrincipalName`
      )
      assert.deepEqual(user, {
        displayName: 'Admin SSB',
        email: null,
        businessPhone: null,
      })
    })

    test('returns user email from userPrinsipalName if email missing', async () => {
      payload = mockGraphSuccess({
        displayName: 'Admin SSB',
        userPrincipalName: 'admin.ssb@ssb.no',
      })
      const { fetchUserByEmail } = await import(`../plugins/entraReaderClient`)
      const user = await fetchUserByEmail(TEST_EMAIL, 'token')
      assert.equal(
        fetchMock.mock.calls[0]?.arguments[0],
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(TEST_EMAIL)}?$select=displayName,businessPhones,mail,userPrincipalName`
      )
      assert.deepEqual(user, {
        displayName: 'Admin SSB',
        email: 'admin.ssb@ssb.no',
        businessPhone: null,
      })
    })
  })
})

////////////// MOCK DATA ////////////////////////////////

const entraUserResult = {
  initials: 'admin',
  user: {
    displayName: 'Admin SSB',
    email: TEST_EMAIL,
    businessPhone: '123',
  },
}
