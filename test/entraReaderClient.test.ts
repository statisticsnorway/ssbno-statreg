// test/entraReaderClient.test.ts
import { describe, test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

const originalEnv = process.env
const originalFetch = global.fetch

const TEST_EMAIL = 'admin@ssbno.onmicrosoft.com'

async function loadFreshClient() {
  const mod = await import(`../plugins/entraReaderClient?test=${Math.random()}`)
  return mod.fetchUserByEmail
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
    global.fetch = originalFetch
  })

  test('fetchUserByEmail → returns mapped user when Graph lookup succeeds', async () => {
    let call = 0
    let lastUrl = ''

    global.fetch = async (url: any) => {
      call++
      lastUrl = String(url)

      if (call === 1) {
        return {
          ok: true,
          json: async () => ({ access_token: 'fake-token', expires_in: 3600 }),
        } as any
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          displayName: 'Admin SSB',
          businessPhones: ['+4797687744'],
          mail: TEST_EMAIL,
        }),
      } as any
    }

    const fetchUserByEmail = await loadFreshClient()
    const user = await fetchUserByEmail(TEST_EMAIL)

    assert.ok(lastUrl.includes(encodeURIComponent(TEST_EMAIL)))
    assert.deepEqual(user, {
      displayName: 'Admin SSB',
      email: TEST_EMAIL,
      businessPhone: '+4797687744',
    })
  })

  test('fetchUserByEmail → returns null when Graph returns 404', async () => {
    let call = 0
    let lastUrl = ''

    global.fetch = async (url: any) => {
      call++
      lastUrl = String(url)

      if (call === 1) {
        return {
          ok: true,
          json: async () => ({ access_token: 'fake-token', expires_in: 3600 }),
        } as any
      }

      return {
        ok: false,
        status: 404,
        text: async () => 'Not found',
      } as any
    }

    const fetchUserByEmail = await loadFreshClient()
    const user = await fetchUserByEmail(TEST_EMAIL)

    assert.ok(lastUrl.includes(encodeURIComponent(TEST_EMAIL)))
    assert.equal(user, null)
  })

  test('fetchUserByEmail → throws when Graph returns non-404 error', async () => {
    let call = 0
    let lastUrl = ''

    global.fetch = async (url: any) => {
      call++
      lastUrl = String(url)

      if (call === 1) {
        return {
          ok: true,
          json: async () => ({ access_token: 'fake-token', expires_in: 3600 }),
        } as any
      }

      return {
        ok: false,
        status: 500,
        text: async () => 'Internal error',
      } as any
    }

    const fetchUserByEmail = await loadFreshClient()

    await assert.rejects(fetchUserByEmail(TEST_EMAIL), /Graph request failed: 500/)

    assert.ok(lastUrl.includes(encodeURIComponent(TEST_EMAIL)))
  })

  test('getAccessToken → throws when required Entra env vars are missing', async () => {
    process.env = {}

    const fetchUserByEmail = await loadFreshClient()

    await assert.rejects(fetchUserByEmail(TEST_EMAIL), /Missing Azure Entra configuration/)
  })

  test('fetchUsersByInitials → returns success and not-found entries for mixed input', async () => {
    let call = 0

    global.fetch = async () => {
      call++

      if (call === 1) {
        return {
          ok: true,
          json: async () => ({
            access_token: 'fake-token',
            expires_in: 3600,
          }),
        } as any
      }

      if (call === 2) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            displayName: 'Admin SSB',
            businessPhones: ['123'],
            mail: 'admin@ssb.no',
          }),
        } as any
      }

      if (call === 3) {
        return {
          ok: false,
          status: 404,
          text: async () => 'Not found',
        } as any
      }

      throw new Error('Unexpected fetch call')
    }

    const mod = await import(`../plugins/entraReaderClient?test=${Math.random()}`)
    const result = await mod.fetchUsersByInitials('admin,missing')

    assert.deepEqual(result, [
      {
        initials: 'admin',
        user: {
          displayName: 'Admin SSB',
          email: 'admin@ssb.no',
          businessPhone: '123',
        },
      },
      {
        initials: 'missing',
        user: null,
        error: 'User not found',
      },
    ])
  })
})
