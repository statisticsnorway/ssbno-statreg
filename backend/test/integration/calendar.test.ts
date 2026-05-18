import { describe, expect, test } from 'vitest'

const BASE_URL = process.env.API_URL ?? 'http://localhost:8080/statistikkregisteret/api'

const headers = {
  'Content-Type': 'application/json',
}
describe('calendarController ', () => {
  test('creates blocked date when client posts', async () => {
    const response = await fetch(`${BASE_URL}/calendar/blocked-release-days/2027-05-07`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ blocked_comment: 'Inneklemt dag' }),
    })
    const json = await response.json()
    expect(response.status).toBe(200)
    expect(json).toContainEqual({
      blocked_comment: 'Inneklemt dag',
      date: '2027-05-07',
    })
  })

  test('retrieves date status for days in range', async () => {
    const response = await fetch(`${BASE_URL}/calendar?fromDate=2026-05-25&toDate=2026-05-31`)
    expect(response.status).toBe(200)
    const list = await response.json()
    expect(list).toStrictEqual({
      '2026-05-25': { status: 'BLOCKED' },
      '2026-05-26': { status: 'FEW' },
      '2026-05-27': { status: 'NONE' },
      '2026-05-28': { status: 'NONE' },
      '2026-05-29': { status: 'NONE' },
      '2026-05-30': { status: 'BLOCKED' },
      '2026-05-31': { status: 'BLOCKED' },
    })
  })
})
