import { test, before, describe } from 'node:test'
import assert from 'node:assert/strict'
import { mock } from 'node:test'

describe('entraUserService ', () => {
  describe('fetchUsers ', () => {
    const fetchUserByEmailMock = mock.fn(async (email: string) => {
      if (email === 'ola@ssb.no')
        return { displayName: 'Ola Nordmann', email: 'ola.nordmann@ssb.no', businessPhone: '11223344' }
      if (email === 'infotjenesten@ssb.no')
        return { displayName: 'Infotjenesten', email: 'infotjenesten@ssb.no', businessPhone: '11223344' }
      if (email === 'nonExisting@ssb.no') return null
      if (email === 'failing call') throw new Error('Graph request failed: 500 something failed')
      if (email === 'userWithoutEmailAndPhone@ssb.no')
        return { displayName: 'Demo bruker', email: null, businessPhone: null }
    })
    const getAccessTokenMock = mock.fn(() => 'token' as any)
    let fetchUsers: Function

    before(async () => {
      const entraClient = await import('../plugins/entraReaderClient')
        // eslint-disable-next-line no-unused-vars
        .then(({ fetchUserByEmail: _, getAccessToken: a, ...rest }) => rest)
      mock.module('../plugins/entraReaderClient', {
        namedExports: { fetchUserByEmail: fetchUserByEmailMock, getAccessToken: getAccessTokenMock, entraClient },
      })
      ;({ fetchUsers } = await import('@/services/entraUserService'))
    })

    test('returns empty array when users array is empty', async () => {
      const result = await fetchUsers([])

      assert.deepEqual(result, [])
      assert.equal(getAccessTokenMock.mock.callCount(), 0)
    })

    test('returns original users when token retrieval fails', async () => {
      getAccessTokenMock.mock.mockImplementationOnce(() => null)

      const result = await fetchUsers([{ username: 'ola', email: 'ignored@test.com' }])

      assert.deepEqual(result, [{ username: 'ola', email: 'ignored@test.com' }])
      assert.equal(getAccessTokenMock.mock.callCount(), 1)
      assert.equal(fetchUserByEmailMock.mock.callCount(), 0)
    })

    test('returns entra users', async () => {
      const usersInput = [
        { username: 'ola', email: 'ola.nordmann@ssb.no' },
        { username: null, email: 'infotjenesten@ssb.no' },
      ]

      const result = await fetchUsers(usersInput)

      assert.equal(result!.length, 2)
      assert.deepEqual(result, [
        {
          lookupEmail: 'ola@ssb.no',
          user: { displayName: 'Ola Nordmann', email: 'ola.nordmann@ssb.no', businessPhone: '11223344' },
        },
        {
          lookupEmail: 'infotjenesten@ssb.no',
          user: { displayName: 'Infotjenesten', email: 'infotjenesten@ssb.no', businessPhone: '11223344' },
        },
      ])
      assert.deepEqual(result?.[1], resultInfotjenesten)
    })

    test('returns user without email & phone', async () => {
      const result = await fetchUsers([{ username: null, email: 'userWithoutEmailAndPhone@ssb.no' }])

      assert.equal(result!.length, 1)
      assert.deepEqual(result, [
        {
          lookupEmail: 'userWithoutEmailAndPhone@ssb.no',
          user: { displayName: 'Demo bruker', email: null, businessPhone: null },
        },
      ])
    })

    test('handles 404 user', async () => {
      const result = await fetchUsers([{ email: 'nonExisting@ssb.no', username: 'nonExisting' }])

      assert.deepEqual(result, [
        {
          lookupEmail: 'nonExisting@ssb.no',
          user: null,
          error: 'User not found',
        },
      ])
    })

    test('handles API failure without stopping execution', async () => {
      fetchUserByEmailMock.mock.mockImplementationOnce(() => Promise.reject('some error'))
      const result = await fetchUsers([
        { email: 'failing call', username: 'whatever' },
        { username: 'ola', email: 'ola.nordmann@ssb.no' },
      ])

      assert.deepEqual(result, [
        {
          lookupEmail: 'whatever@ssb.no',
          user: null,
          error: 'Lookup failed',
        },
        {
          lookupEmail: 'ola@ssb.no',
          user: { displayName: 'Ola Nordmann', email: 'ola.nordmann@ssb.no', businessPhone: '11223344' },
        },
      ])
    })
  })
})

// --- Mock results ---
const resultInfotjenesten = {
  lookupEmail: 'infotjenesten@ssb.no',
  user: { displayName: 'Infotjenesten', email: 'infotjenesten@ssb.no', businessPhone: '11223344' },
}
