import { vi, test, describe, expect } from 'vitest'
import { fetchUsers } from '@/services/entraUserService'

const { fetchUserByEmailMock, getAccessTokenMock } = vi.hoisted(() => ({
  fetchUserByEmailMock: vi.fn(async (email: string) => {
    if (email === 'ola@ssb.no')
      return { displayName: 'Ola Nordmann', email: 'ola.nordmann@ssb.no', businessPhone: '11223344' }
    if (email === 'infotjenesten@ssb.no')
      return { displayName: 'Infotjenesten', email: 'infotjenesten@ssb.no', businessPhone: '11223344' }
    if (email === 'nonExisting@ssb.no') return null
    if (email === 'failing call') throw new Error('Graph request failed: 500 something failed')
    if (email === 'userWithoutEmailAndPhone@ssb.no')
      return { displayName: 'Demo bruker', email: null, businessPhone: null }
  }),
  getAccessTokenMock: vi.fn(() => Promise.resolve('token')),
}))

vi.mock(import('../plugins/entraReaderClient'), async (importOriginal) => {
  const original = await importOriginal<typeof import('../plugins/entraReaderClient')>()
  return {
    ...original,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchUserByEmail: fetchUserByEmailMock as any,
    getAccessToken: getAccessTokenMock,
  }
})

describe('entraUserService ', () => {
  describe('fetchUsers ', () => {
    test('returns empty array when users array is empty', async () => {
      const result = await fetchUsers([])

      expect(result).toStrictEqual([])
      expect(getAccessTokenMock).toHaveBeenCalledTimes(0)
    })

    test('returns original users when token retrieval fails', async () => {
      getAccessTokenMock.mockImplementationOnce(() => Promise.resolve(''))

      const result = await fetchUsers([{ username: 'ola', email: 'ignored@test.com' }])

      expect(result).toStrictEqual([{ username: 'ola', email: 'ignored@test.com' }])

      expect(getAccessTokenMock).toHaveBeenCalledOnce()
      expect(fetchUserByEmailMock).toHaveBeenCalledTimes(0)
    })

    test('returns entra users', async () => {
      const usersInput = [
        { username: 'ola', email: 'ola.nordmann@ssb.no' },
        { username: null, email: 'infotjenesten@ssb.no' },
      ]

      const result = await fetchUsers(usersInput)

      expect(result!.length).toBe(2)
      expect(result).toStrictEqual([
        {
          lookupEmail: 'ola@ssb.no',
          user: { displayName: 'Ola Nordmann', email: 'ola.nordmann@ssb.no', businessPhone: '11223344' },
        },
        {
          lookupEmail: 'infotjenesten@ssb.no',
          user: { displayName: 'Infotjenesten', email: 'infotjenesten@ssb.no', businessPhone: '11223344' },
        },
      ])
      expect(result?.[1]).toStrictEqual(resultInfotjenesten)
    })

    test('returns user without email & phone', async () => {
      const result = await fetchUsers([{ username: null, email: 'userWithoutEmailAndPhone@ssb.no' }])

      expect(result!.length).toBe(1)
      expect(result).toStrictEqual([
        {
          lookupEmail: 'userWithoutEmailAndPhone@ssb.no',
          user: { displayName: 'Demo bruker', email: null, businessPhone: null },
        },
      ])
    })

    test('handles 404 user', async () => {
      const result = await fetchUsers([{ email: 'nonExisting@ssb.no', username: 'nonExisting' }])

      expect(result).toStrictEqual([
        {
          lookupEmail: 'nonExisting@ssb.no',
          user: null,
          error: 'User not found',
        },
      ])
    })

    test('handles API failure without stopping execution', async () => {
      fetchUserByEmailMock.mockImplementationOnce(() => Promise.reject('some error'))
      const result = await fetchUsers([
        { email: 'failing call', username: 'whatever' },
        { username: 'ola', email: 'ola.nordmann@ssb.no' },
      ])

      expect(result).toStrictEqual([
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
