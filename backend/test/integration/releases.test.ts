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
  period_to: '2024-10-01',
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

    // GET versions to check that create event is registered in auditlog
    const versions = await request(app).get(`/statistikkregisteret/api/releases/${created.body.id}/versions`)
    expect(versions.status).toBe(200)
    expect(versions.body).toHaveLength(1)
    expect(versions.body[0].change_type).toBe('create')
  })

  test('admin archives a release', async () => {
    // POST shortname and statistic with variant (to put the release under)
    const newShortname = 'archive_test'
    await request(app).post('/statistikkregisteret/api/shortnames').set(headers).send({ shortname: newShortname })
    const statistic = await request(app)
      .post(`/statistikkregisteret/api/statistics/${newShortname}`)
      .set(headers)
      .send({
        status: { code: 'K' },
        division: '101',
        name: 'Archive test',
        variants: [{ frequency: { code: 'W' }, revision: { code: 'I' } }],
      })
    expect(statistic.status).toBe(200)
    const variantId = statistic.body.variants[0].id

    // POST release
    const created = await request(app)
      .post(`/statistikkregisteret/api/statistics/${newShortname}/variants/${variantId}/releases`)
      .set(headers)
      .send(body)
    expect(created.status).toBe(200)

    // GET releases endpoints before archive to check that release is included
    const variantReleasesBefore = await request(app).get(
      `/statistikkregisteret/api/statistics/${newShortname}/variants/${variantId}/releases`
    )
    expect(variantReleasesBefore.status).toBe(200)
    expect(variantReleasesBefore.body).toMatchObject({ total: 1, releases: [{ id: created.body.id }] })

    const filteredReleasesBefore = await request(app)
      .get('/statistikkregisteret/api/releases')
      .query({ shortname: newShortname })
    expect(filteredReleasesBefore.status).toBe(200)
    expect(filteredReleasesBefore.body).toMatchObject({ total: 1, releases: [{ id: created.body.id }] })

    const singleReleaseBefore = await request(app).get(`/statistikkregisteret/api/releases/${created.body.id}`)
    expect(singleReleaseBefore.status).toBe(200)

    // PUT release to archive it
    const archived = await request(app)
      .put(`/statistikkregisteret/api/releases/${created.body.id}`)
      .set(headers)
      .send({ ...body, comment: 'Archive release.', archived: true })
    expect(archived.status).toBe(200)

    // GET releases endpoints after archive to check that release is gone
    const variantReleasesAfter = await request(app).get(
      `/statistikkregisteret/api/statistics/${newShortname}/variants/${variantId}/releases`
    )
    expect(variantReleasesAfter.status).toBe(200)
    expect(variantReleasesAfter.body).toStrictEqual({ total: 0, releases: [] })

    const filteredReleasesAfter = await request(app)
      .get('/statistikkregisteret/api/releases')
      .query({ shortname: newShortname })
    expect(filteredReleasesAfter.status).toBe(200)
    expect(filteredReleasesAfter.body).toStrictEqual({ total: 0, releases: [] })

    const singleReleaseAfter = await request(app).get(`/statistikkregisteret/api/releases/${created.body.id}`)
    expect(singleReleaseAfter.status).toBe(410)
  })

  test('client picks release and updates fields', async () => {
    // This integration test simulates the following events:
    // 1. User opens the release listing page
    // 2. User clicks on a release to open the release details page
    // 3. User clicks "edit", changes a couple of fields and submits
    // 4. User opens the release details page to check that values are changed
    // 5. User opens version history to check that change is registered

    // 1. GET release listing and pick release
    const list = await request(app).get(
      `/statistikkregisteret/api/statistics/${shortname}/variants/${variantId}/releases`
    )
    expect(list.status).toBe(200)
    expect(list.body.total).toBeGreaterThan(1)
    const picked = list.body.releases[0]

    // 2. GET release to see full details of picked release
    const pickedReleaseResponse = await request(app).get(`/statistikkregisteret/api/releases/${picked.id}`)
    expect(pickedReleaseResponse.status).toBe(200)
    const pickedRelease = pickedReleaseResponse.body as ReleaseDetails

    // 3. PUT release with updated fields
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

    // 4. GET release to check persistence of new values
    const updatedReleaseResponse = await request(app).get(`/statistikkregisteret/api/releases/${picked.id}`)
    expect(updatedReleaseResponse.status).toBe(200)
    expect(updatedReleaseResponse.body.id).toBe(picked.id)
    const updatedRelease = updatedReleaseResponse.body as ReleaseDetails
    assertEqualReleaseData(updatedRelease, updateBody)

    // 5. GET versions to check that change is registered
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
          old_value: pickedRelease.publish_time,
          new_value: updatedRelease.publish_time,
        },
        {
          field_name: 'release_date_precision',
          old_value: pickedRelease.release_date_precision,
          new_value: updatedRelease.release_date_precision,
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
