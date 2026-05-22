import { describe, expect, test } from 'vitest'

const BASE_URL = process.env.API_URL ?? 'http://localhost:8080/statistikkregisteret/api'

const headers = {
  'Content-Type': 'application/json',
}
const body = {
  publish_time: '2024-10-15T08:00:00Z',
  period_to: '2024-12-31',
  period_from: '2024-09-01',
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
    expect(response.status).toBe(200)
    const created = await response.json()

    // GET release
    response = await fetch(`${BASE_URL}/releases/${created.id}`)
    expect(response.status).toBe(200)
    const fetched = await response.json()

    // test persistence
    expect(fetched.id).toBe(created.id)
    assertEqualReleaseData(fetched, body)
  })

  test('client picks release and updates fields', async () => {
    // GET release listing and pick release
    let response = await fetch(`${BASE_URL}/statistics/${shortname}/variants/${variantId}/releases`)
    expect(response.status).toBe(200)
    const list = await response.json()
    expect(list.total).toBeGreaterThan(1)
    const picked = list.releases[0]

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
    expect(response.status).toBe(200)

    // GET release
    response = await fetch(`${BASE_URL}/releases/${picked.id}`)
    expect(response.status).toBe(200)
    const fetched = await response.json()

    // test persistence
    expect(fetched.id, picked.id)
    assertEqualReleaseData(fetched, body)
  })
})

test('/releases are sorted from newest to oldest publish_time by default', async () => {
  const response = await fetch(`${BASE_URL}/releases`)

  expect(response.status).toBe(200)

  const data = await response.json()
  const releases = data.releases

  expect(releases.length).toBeGreaterThan(1)

  for (let i = 0; i < releases.length - 1; i++) {
    const current = new Date(releases[i].publish_time).getTime()
    const next = new Date(releases[i + 1].publish_time).getTime()

    expect(current).toBeGreaterThanOrEqual(next)
  }
})

test('/releases?sort=publish_time are sorted from oldest to newest publish_time', async () => {
  const response = await fetch(`${BASE_URL}/releases?sort=publish_time`)

  expect(response.status).toBe(200)

  const data = await response.json()
  const releases = data.releases

  expect(releases.length).toBeGreaterThan(1)

  for (let i = 0; i < releases.length - 1; i++) {
    const current = new Date(releases[i].publish_time).getTime()
    const next = new Date(releases[i + 1].publish_time).getTime()

    expect(next).toBeGreaterThanOrEqual(current)
  }
})

function addMonthsToDate(date: string, months: number): string {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertEqualReleaseData(fetched: any, expected: any) {
  expect(new Date(fetched.publish_time)).toStrictEqual(new Date(expected.publish_time))
  expect(new Date(fetched.period_from)).toStrictEqual(new Date(expected.period_from))
  expect(new Date(fetched.period_to)).toStrictEqual(new Date(expected.period_to))
  expect(fetched.release_date_precision).toStrictEqual(expected.release_date_precision)
}
