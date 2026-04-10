import { describe, test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import type { Users } from '@/types/entra'

const BASE_URL = process.env.API_URL ?? 'http://localhost:8080'

const fetchUsersMock = mock.fn(async (users: Users[]) => users)

before(async () => {
  // eslint-disable-next-line no-unused-vars
  const entraUser = await import('@/services/entraUserService').then(({ fetchUsers: _, ...rest }) => rest)
  mock.module('@/services/entraUserService', {
    namedExports: {
      fetchUsers: fetchUsersMock,
      entraUser,
    },
  })
})

describe('GET /releases/4 ', () => {
  test('returns status code 200', async () => {
    const res = await fetch(`${BASE_URL}/statistics/kpi`)

    assert.equal(res.status, 200)
  })
})
