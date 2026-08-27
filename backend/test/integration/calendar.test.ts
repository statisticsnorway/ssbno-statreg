import { describe, expect, test } from 'vitest'
import { createApp } from '@/app'
import request from 'supertest'

const app = await createApp()

const headers = {
  'Content-Type': 'application/json',
}
describe('calendarController ', () => {
  test('creates blocked date when client posts', async () => {
    const response = await request(app)
      .post('/statistikkregisteret/api/calendar/blocked-release-days/2027-05-07')
      .set(headers)
      .send({ blocked_comment: 'Inneklemt dag' })
    expect(response.status).toBe(200)
    expect(response.body).toContainEqual({
      automatically_blocked: false,
      blocked_comment: 'Inneklemt dag',
      date: '2027-05-07',
    })
  })

  test('retrieves date status for days in range', async () => {
    const response = await request(app)
      .get('/statistikkregisteret/api/calendar')
      .query({ fromDate: '2026-05-25', toDate: '2026-05-31' })
    expect(response.status).toBe(200)
    expect(response.body).toStrictEqual({
      '2026-05-25': { status: 'BLOCKED' },
      '2026-05-26': { status: 'FEW' },
      '2026-05-27': { status: 'NONE' },
      '2026-05-28': { status: 'NONE' },
      '2026-05-29': { status: 'NONE' },
      '2026-05-30': { status: 'BLOCKED' },
      '2026-05-31': { status: 'BLOCKED' },
    })
  })

  test('creates and deletes a blocked date', async () => {
    const date = '2099-11-18'

    const created = await request(app)
      .post(`/statistikkregisteret/api/calendar/blocked-release-days/${date}`)
      .set(headers)
      .send({ blocked_comment: 'Integration test' })
    expect(created.status).toBe(200)

    const calendarBefore = await request(app)
      .get('/statistikkregisteret/api/calendar')
      .query({ fromDate: date, toDate: date })
    expect(calendarBefore.status).toBe(200)
    expect(calendarBefore.body[date]).toStrictEqual({ status: 'BLOCKED' })

    const blockedBefore = await request(app).get('/statistikkregisteret/api/calendar/blocked-release-days')
    expect(blockedBefore.status).toBe(200)
    expect(blockedBefore.body).toContainEqual(expect.objectContaining({ date }))

    const deleted = await request(app)
      .delete(`/statistikkregisteret/api/calendar/blocked-release-days/${date}`)
      .set(headers)
    expect(deleted.status).toBe(200)

    const calendarAfter = await request(app)
      .get('/statistikkregisteret/api/calendar')
      .query({ fromDate: date, toDate: date })
    expect(calendarAfter.status).toBe(200)
    expect(calendarAfter.body[date]).toStrictEqual({ status: 'NONE' })

    const blockedAfter = await request(app).get('/statistikkregisteret/api/calendar/blocked-release-days')
    expect(blockedAfter.status).toBe(200)
    expect(blockedAfter.body).not.toContainEqual(expect.objectContaining({ date }))
  })
})
