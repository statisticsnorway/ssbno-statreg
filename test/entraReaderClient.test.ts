import { describe, test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

const TEST_INITIALS = 'admin'
const TEST_EMAIL = 'admin@ssb.no'

const originalEnv = process.env

function createFetchMock(responders: any[]) {
  let callIndex = 0
  return mock.method(globalThis, 'fetch', async (...args: any[]) => {
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
    test('throws Error when required Entra env vars are missing', async () => {
      process.env = {}
      const { fetchUserByEmail } = await import(`../plugins/entraReaderClient?test=${Math.random()}`)
      await assert.rejects(() => fetchUserByEmail(TEST_EMAIL), /Missing Azure Entra configuration/)
    })

    // TODO: Add test when token fails
  })

  describe('fetchUserByEmail', async () => {
    test('returns user when initial and email is passed ', async () => {
      const fetchMock = createFetchMock([mockTokenSuccess(), mockGraphSuccess(mockFetchEntraUserResponse)])
      const { fetchUserByEmail } = await import(`../plugins/entraReaderClient?test=${Math.random()}`)
      const user = await fetchUserByEmail(TEST_INITIALS, TEST_EMAIL)

      assert.equal(
        fetchMock.mock.calls[1]?.arguments[0], // first argument of fetch()
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(TEST_EMAIL)}?$select=displayName,businessPhones,mail,userPrincipalName`
      )
      assert.deepEqual(user, mockEntraUserList[0]?.user)
    })

    test('returns user when initial is undefined and email is passed', async () => {
      const fetchMock = createFetchMock([mockTokenSuccess(), mockGraphSuccess(mockFetchEntraUserResponse)])
      const { fetchUserByEmail } = await import(`../plugins/entraReaderClient?test=${Math.random()}`)
      const user = await fetchUserByEmail(undefined, TEST_EMAIL)

      assert.equal(
        fetchMock.mock.calls[1]?.arguments[0], // first argument of fetch()
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(TEST_EMAIL)}?$select=displayName,businessPhones,mail,userPrincipalName`
      )
      assert.deepEqual(user, mockEntraUserList[0]?.user)
    })

    test('returns null when Graph returns 404', async () => {
      createFetchMock([mockTokenSuccess(), mockGraphError(404, 'Not found')])
      const { fetchUserByEmail } = await import(`../plugins/entraReaderClient?test=${Math.random()}`)
      const user = await fetchUserByEmail(undefined)

      assert.equal(user, null)
    })
  })

  describe('fetchUsersByInitials', async () => {
    test('returns user entries when an array of initials is passed', async () => {
      createFetchMock([
        mockTokenSuccess(), // token
        mockGraphSuccess(mockFetchEntraUserResponse), // first user found
        mockGraphError(404, 'Not found'), // second user missing
      ])
      const { fetchUsersByInitials } = await import(`../plugins/entraReaderClient?test=${Math.random()}`)

      const result = await fetchUsersByInitials(`${TEST_INITIALS}, missing`)
      assert.deepEqual(result, mockEntraUserList)
    })

    test('returns null when user is not found', async () => {
      createFetchMock([mockTokenSuccess(), mockGraphError(404, 'Not found')])
      const { fetchUsersByInitials } = await import(`../plugins/entraReaderClient?test=${Math.random()}`)
      const user = await fetchUsersByInitials(undefined)

      assert.equal(user, null)
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
