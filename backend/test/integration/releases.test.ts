import { describe, expect, test } from 'vitest'
import { createApp } from '@/app'
import request from 'supertest'
import { ReleaseDetails, ReleaseListing } from '@ssbno-statreg/shared'

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

    // GET versions
    const versions = await request(app).get(`/statistikkregisteret/api/releases/${created.body.id}/versions`)
    expect(versions.status).toBe(200)
    expect(versions.body).toHaveLength(1)
    expect(versions.body[0].change_type).toBe('create')
  })

  test('client picks release and updates fields', async () => {
    // GET release listing and pick release
    const list = await request(app).get(
      `/statistikkregisteret/api/statistics/${shortname}/variants/${variantId}/releases`
    )
    expect(list.status).toBe(200)
    expect(list.body.total).toBeGreaterThan(1)
    const picked = list.body.releases[0]

    // GET release to get full details of picked release
    const pickedReleaseResponse = await request(app).get(`/statistikkregisteret/api/releases/${picked.id}`)
    expect(pickedReleaseResponse.status).toBe(200)
    const pickedRelease = pickedReleaseResponse.body as ReleaseDetails

    // PUT release with updated fields
    const updateBody = {
      publish_time: addMonthsToDate(pickedRelease.publish_time!, 3),
      period_from: pickedRelease.period_from,
      period_to: pickedRelease.period_to,
      release_date_precision: 'month',
      comment: 'Postpone release date.',
    }
    const putResponse = await request(app)
      .put(`/statistikkregisteret/api/releases/${picked.id}`)
      .set(headers)
      .send(updateBody)
    expect(putResponse.status).toBe(200)

    // GET release to check persistence of changes
    const updatedReleaseResponse = await request(app).get(`/statistikkregisteret/api/releases/${picked.id}`)
    expect(updatedReleaseResponse.status).toBe(200)
    expect(updatedReleaseResponse.body.id).toBe(picked.id)
    assertEqualReleaseData(updatedReleaseResponse.body, updateBody)

    // GET versions to check that changes are registered in auditlog
    const versions = await request(app).get(`/statistikkregisteret/api/releases/${picked.id}/versions`)
    expect(versions.status).toBe(200)
    const lastVersion = versions.body[0]
    expect(lastVersion.change_type).toBe('update')
    expect(lastVersion.comment).toBe(updateBody.comment)
    expect(lastVersion.changed_values).toHaveLength(2)
    expect(lastVersion.changed_values).toEqual(
      expect.arrayContaining([
        {
          field_name: 'publish_time',
          old_value: JSON.stringify(pickedRelease.publish_time),
          new_value: JSON.stringify(updateBody.publish_time),
        },
        {
          field_name: 'release_date_precision',
          old_value: JSON.stringify(pickedRelease.release_date_precision),
          new_value: JSON.stringify(updateBody.release_date_precision),
        },
      ])
    )
  })
})

describe('release listing can be filtered by approval status', () => {
  test('returns only releases with GODKJENT approval status', async () => {
    const response = await request(app).get('/statistikkregisteret/api/releases?approval_status=GODKJENT')
    expect(response.status).toBe(200)
    expect(response.body.total).toBeGreaterThan(0)
    expect(response.body.releases.every((release: ReleaseListing) => release.approval_status === 'GODKJENT')).toBe(true)
  })
})

describe('/releases/bulk-approve', () => {
  test('can approve two newly created releases', async () => {
    // POST two identical releases and check that both have approval status FORSLAG
    const created1 = await request(app)
      .post(`/statistikkregisteret/api/statistics/${shortname}/variants/${variantId}/releases`)
      .set(headers)
      .send(body)
    expect(created1.status).toBe(200)
    expect(created1.body.approval_status).toBe('GODKJENT')

    const created2 = await request(app)
      .post(`/statistikkregisteret/api/statistics/${shortname}/variants/${variantId}/releases`)
      .set(headers)
      .send(body)
    expect(created2.status).toBe(200)
    expect(created2.body.approval_status).toBe('GODKJENT')

    // POST bulk approve the two releases
    const approveResponse = await request(app)
      .post('/statistikkregisteret/api/releases/bulk-approve')
      .set(headers)
      .send({ ids: [created1.body.id, created2.body.id] })
    expect(approveResponse.status).toBe(207)
    expect(approveResponse.body.releases).toStrictEqual([
      { id: created1.body.id, status: 200 },
      { id: created2.body.id, status: 200 },
    ])

    // GET verify that new status is persisted
    const fetched1 = await request(app).get(`/statistikkregisteret/api/releases/${created1.body.id}`)
    expect(fetched1.status).toBe(200)
    expect(fetched1.body.approval_status).toBe('GODKJENT')

    const fetched2 = await request(app).get(`/statistikkregisteret/api/releases/${created2.body.id}`)
    expect(fetched2.status).toBe(200)
    expect(fetched2.body.approval_status).toBe('GODKJENT')
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
