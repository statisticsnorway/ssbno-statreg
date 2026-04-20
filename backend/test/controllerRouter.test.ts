import { describe, test, expect, beforeEach, vi } from 'vitest'
import express, { Router, type RequestHandler } from 'express'
import controllerRouter from '@/api/core/controllerRouter'
import { invoke, makeSkipAuthMarker } from './helpers'
import { MockResponse } from 'node-mocks-http'

describe('controllerRouter', () => {
  let requireAuthCalls: string[]
  let requireAuth: RequestHandler

  const fakeController = (router: Router) => {
    const skip = makeSkipAuthMarker()

    router.get('/public', skip, (_req, res) => res.json({ ok: 'public' }))
    router.get('/protected', (_req, res) => res.json({ ok: 'protected' }))

    vi.mock('@/api/controllers/statisticsController', () => ({
      default: () => {},
    }))

    vi.mock('@/api/controllers/releasesController', () => ({
      default: () => {},
    }))

    vi.mock('@/api/controllers/calendarController', () => ({
      default: () => {},
    }))
  }

  const makeApp = () =>
    express()
      .disable('x-powered-by')
      .use(controllerRouter(requireAuth, [fakeController]))

  beforeEach(() => {
    requireAuthCalls = []
    requireAuth = (req, _res, next) => {
      requireAuthCalls.push(`${req.method} ${req.url}`)
      next()
    }
  })

  test('calls requireAuth on protected routes and returns 200', async () => {
    const app = makeApp()
    const res: MockResponse<any> = await invoke(app, 'GET', '/protected')

    expect(res.statusCode).toBe(200)
    expect(res._getJSONData().ok).toBe('protected')
    expect(requireAuthCalls).toHaveLength(1)
    expect(requireAuthCalls[0]).toBe('GET /protected')
  })

  test('bypasses requireAuth on public routes', async () => {
    const app = makeApp()
    const res: MockResponse<any> = await invoke(app, 'GET', '/public')

    expect(res.statusCode).toBe(200)
    expect(res._getJSONData().ok).toBe('public')
    expect(requireAuthCalls).toHaveLength(0)
  })

  test('returns 405 for disallowed methods (e.g., PATCH)', async () => {
    const app = makeApp()
    const res: MockResponse<any> = await invoke(app, 'PATCH', '/public')

    expect(res.statusCode).toBe(405)
    expect(res._getJSONData().error).toBe('Method Not Allowed')
  })

  // Temporarily disabled, waiting for proper routing with /api/ and everything behing /statistikkregisteret/

  // test('returns 404 for unknown routes with allowed method', async () => {
  //   const app = makeApp()
  //   const res: MockResponse<any> = await invoke(app, 'GET', '/unknown')

  //   expect(res.statusCode).toBe(404)
  //   expect(res._getJSONData().error).toBe('Not Found')
  // })
})
