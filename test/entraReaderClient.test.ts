import { describe, test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

const TEST_INITIALS = 'admin'
const TEST_EMAIL = 'admin@ssb.no'

const originalEnv = process.env

function createFetchMock(responders) {
  let callIndex = 0
  return mock.method(globalThis, 'fetch', async (...args) => {
    const responder = responders[callIndex]
    callIndex++
    if (!responder) throw new Error('Unexpected fetch call ' + callIndex)
    return responder(...args)
  })
}

function mockTokenSuccess() {
  const body = { access_token: 'fake-token', expires_in: 3600 }
  return async () => ({
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  })
}

function mockGraphSuccess(data: object) {
  return async () => ({
    ok: true,
    status: 200,
    json: async () => data,
  })
}

function mockGraphError(status: number, message?: string) {
  return async () => ({
    ok: false,
    status,
    text: async () => message,
  })
}

describe('entraReaderClient', () => {
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
    mock.restoreAll()
  })

  describe('getAccessToken', async () => {
    test('throws when required Entra env vars are missing', async () => {
      process.env = {}
      const { fetchUserByEmail } = await import(`../plugins/entraReaderClient?test=${Math.random()}`)
      await assert.rejects(() => fetchUserByEmail(TEST_EMAIL), /Missing Azure Entra configuration/)
    })
  })

  describe('fetchUserByEmail', async () => {
    test('returns mapped user when Graph lookup succeeds', async () => {
      const fetchMock = createFetchMock([mockTokenSuccess(), mockGraphSuccess(mockFetchEntraUserResponse)])
      const { fetchUserByEmail } = await import(`../plugins/entraReaderClient?test=${Math.random()}`)
      const user = await fetchUserByEmail(TEST_INITIALS)

      assert.equal(
        fetchMock.mock.calls[1]?.arguments[0],
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(TEST_EMAIL)}?$select=displayName,businessPhones,mail,userPrincipalName`
      )
      assert.deepEqual(user, mockEntraUserList[0]?.user)
    })

    test('returns mapped user when Graph lookup succeeds using email', async () => {
      const fetchMock = createFetchMock([mockTokenSuccess(), mockGraphSuccess(mockFetchEntraUserResponse)])
      const { fetchUserByEmail } = await import(`../plugins/entraReaderClient?test=${Math.random()}`)
      const user = await fetchUserByEmail(undefined, TEST_EMAIL)

      assert.equal(
        fetchMock.mock.calls[1]?.arguments[0],
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(TEST_EMAIL)}?$select=displayName,businessPhones,mail,userPrincipalName`
      )
      assert.deepEqual(user, mockEntraUserList[0]?.user)
    })

    test('returns null when Graph returns 404', async () => {
      const { fetchUserByEmail } = await import(`../plugins/entraReaderClient?test=${Math.random()}`)
      await assert.rejects(fetchUserByEmail(TEST_EMAIL), 'Error: OAuth token request failed: 404 Not found')
    })
  })

  describe('fetchUsersByInitials', async () => {
    test('returns success and not-found entries for mixed input', async () => {
      createFetchMock([
        mockTokenSuccess(), // token
        mockGraphSuccess(mockFetchEntraUserResponse), // first user found
        mockGraphError(404, 'Not found'), // second user missing
      ])
      const { fetchUsersByInitials } = await import(`../plugins/entraReaderClient?test=${Math.random()}`)

      const result = await fetchUsersByInitials(`${TEST_INITIALS}, missing`)
      assert.deepEqual(result, mockEntraUserList)
    })
  })
})

////////////// MOCK DATA ////////////////////////////////
const mockFetchEntraUserResponse = {
  displayName: 'Admin SSB',
  businessPhones: ['123'],
  mail: TEST_EMAIL,
}

const mockEntraUserList = [
  {
    initials: TEST_INITIALS,
    user: {
      displayName: 'Admin SSB',
      email: TEST_EMAIL,
      businessPhone: '123',
    },
  },
  {
    initials: 'missing',
    user: null,
    error: 'User not found',
  },
]
