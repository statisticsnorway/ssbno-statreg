import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

const BASE_URL = process.env.API_URL ?? 'http://localhost:8080'

describe('GET /releases/4 ', () => {
  test('returns status code 200', async () => {
    const res = await fetch(`${BASE_URL}/statistics/kpi`)

    assert.equal(res.status, 200)
  })
})
