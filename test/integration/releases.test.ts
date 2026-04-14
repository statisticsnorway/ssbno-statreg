import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { BASE_URL } from './integrationUtils'

describe('GET /releases ', () => {
  test('returns status code 200', async () => {
    const res = await fetch(`${BASE_URL}/releases/1`)

    assert.equal(res.status, 200)
  })
})
