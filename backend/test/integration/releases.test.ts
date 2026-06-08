import { describe, expect, test } from 'vitest'
import { createApp } from '@/app'
import request from 'supertest'

const app = await createApp()

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
    const created = await request(app)
      .post(`/statistikkregisteret/api/statistics/${shortname}/variants/${variantId}/releases`)
      .set(headers)
      .send(body)
    expect(created.status).toBe(200)

    // GET release
    const fetched = await request(app).get(`/statistikkregisteret/api/releases/${created.body.id}`)
    expect(fetched.status).toBe(200)

    // test persistence
    expect(fetched.body.id).toBe(created.body.id)
    assertEqualReleaseData(fetched.body, body)
  })

  test('client picks release and updates fields', async () => {
    // GET release listing and pick release
    const list = await request(app).get(
      `/statistikkregisteret/api/statistics/${shortname}/variants/${variantId}/releases`
    )
    expect(list.status).toBe(200)
    expect(list.body.total).toBeGreaterThan(1)
    const picked = list.body.releases[0]

    // PUT release with updated fields
    const updateBody = {
      publish_time: addMonthsToDate(picked.publish_time, 3),
      period_from: picked.period_from,
      period_to: picked.period_to,
      release_date_precision: 'month',
      comment: 'Postpone release date.',
    }
    const updated = await request(app)
      .put(`/statistikkregisteret/api/releases/${picked.id}`)
      .set(headers)
      .send(updateBody)
    expect(updated.status).toBe(200)

    // GET release
    const fetched = await request(app).get(`/statistikkregisteret/api/releases/${picked.id}`)
    expect(fetched.status).toBe(200)

    // test persistence
    expect(fetched.body.id, picked.id)
    assertEqualReleaseData(fetched.body, updateBody)
  })
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
