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

  test('returns user info for valid email', async () => {
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

  test('returns null when user is not found (404)', async () => {
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

  test('throws on Graph error', async () => {
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

  test('throws when Entra env vars are missing', async () => {
    process.env = {}

    const fetchUserByEmail = await loadFreshClient()

    await assert.rejects(fetchUserByEmail(TEST_EMAIL), /Missing Azure Entra configuration/)
  })
})
