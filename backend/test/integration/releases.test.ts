import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

const BASE_URL = process.env.API_URL ?? 'http://localhost:8080'

const headers = {
  'Content-Type': 'application/json',
}
const body = {
  publish_time: '2024-10-15T08:00:00Z',
  period_to: '2024-12-31T00:00:00Z',
  period_from: '2024-09-01T00:00:00Z',
  release_date_precision: 'month',
}
const shortname = 'energ'
const variantId = 1

describe('release data is persisted when ', () => {
  test('client creates a new release', async () => {
    // POST release
    let response = await fetch(`${BASE_URL}/statistics/${shortname}/variants/${variantId}/releases`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    })
    assert.equal(response.status, 200)
    const created = await response.json()

    // GET release
    response = await fetch(`${BASE_URL}/releases/${created.id}`)
    assert.equal(response.status, 200)
    const fetched = await response.json()

    // test persistence
    assert.equal(fetched.id, created.id)
    assertEqualReleaseData(fetched, body)
  })

  test('client picks release and updates fields', async () => {
    // GET release listing and pick release
    let response = await fetch(`${BASE_URL}/statistics/${shortname}/variants/${variantId}/releases`)
    assert.equal(response.status, 200)
    const list = await response.json()
    assert.ok(list.length > 0)
    const picked = list[0]

    // PUT release with updated fields
    const body = {
      publish_time: addMonthsToDate(picked.publish_time, 3),
      period_from: picked.period_from,
      period_to: picked.period_to,
      release_date_precision: 'month',
      comment: 'Postpone release date.',
    }
    response = await fetch(`${BASE_URL}/releases/${picked.id}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(body),
    })
    assert.equal(response.status, 200)

    // GET release
    response = await fetch(`${BASE_URL}/releases/${picked.id}`)
    assert.equal(response.status, 200)
    const fetched = await response.json()

    // test persistence
    assertEqualReleaseData(fetched, body)
  })
})

function addMonthsToDate(date: string, months: number): string {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
}

function assertEqualReleaseData(fetched: any, expected: any) {
  assert.deepEqual(new Date(fetched.publish_time), new Date(expected.publish_time))
  assert.deepEqual(new Date(fetched.period_from), new Date(expected.period_from))
  assert.deepEqual(new Date(fetched.period_to), new Date(expected.period_to))
  assert.equal(fetched.release_date_precision, expected.release_date_precision)
}
