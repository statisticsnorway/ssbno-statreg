/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, beforeEach, vi } from 'vitest'
import express, { Router, type RequestHandler, type Response } from 'express'
import httpMocks from 'node-mocks-http'
import { EventEmitter } from 'node:events'
import controllerRouter from '@/api/core/controllerRouter'
import { invoke, makeSkipAuthMarker } from './helpers'
import { MockResponse } from 'node-mocks-http'

describe('controllerRouter', () => {
  let requireAuthCalls: string[]
  let requireAuth: RequestHandler

  const fakeController = (router: Router) => {
    const skip = makeSkipAuthMarker()
    const skipWithEffect = ((req, _res, next) => {
      ;(req as any).skipMarkerExecuted = true
      next()
    }) as RequestHandler & { __skipAuth?: boolean }
    skipWithEffect.__skipAuth = true

    router.get('/public', skip, (_req, res) => res.json({ ok: 'public' }))
    router.get('/mixed', skip, (_req, res) => res.json({ ok: 'mixed-public' }))
    router.post('/mixed', (_req, res) => res.json({ ok: 'mixed-protected' }))
    router.get('/protected', (_req, res) => res.json({ ok: 'protected' }))
    router.get('/public-item/:id', skip, (req, res) => res.json({ ok: `public-${req.params.id}` }))
    router.get('/protected-item/:id', (req, res) => res.json({ ok: `protected-${req.params.id}` }))
    router.get('/items/:id', (_req, res) => res.json({ ok: 'item' }))
    router.get('/skip-marker-strip', skipWithEffect, (req, res) =>
      res.json({ skipMarkerExecuted: Boolean((req as any).skipMarkerExecuted) })
    )
    router.get(
      '/public-with-middleware',
      skip,
      (req, _res, next) => {
        ;(req as any).normalMiddlewareExecuted = true
        next()
      },
      (req, res) => res.json({ normalMiddlewareExecuted: Boolean((req as any).normalMiddlewareExecuted) })
    )
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
    const res: MockResponse<any> = await invoke(app, 'GET', '/api/protected')

    expect(res.statusCode).toBe(200)
    expect(res._getJSONData().ok).toBe('protected')
    expect(requireAuthCalls).toHaveLength(1)
    expect(requireAuthCalls[0]).toBe('GET /api/protected')
  })

  test('bypasses requireAuth on public routes', async () => {
    const app = makeApp()
    const res: MockResponse<any> = await invoke(app, 'GET', '/api/public')

    expect(res.statusCode).toBe(200)
    expect(requireAuthCalls).toHaveLength(0)
  })

  test('bypasses requireAuth on public routes with trailing slash', async () => {
    const app = makeApp()
    const res: MockResponse<any> = await invoke(app, 'GET', '/api/public/')

    expect(res.statusCode).toBe(200)
    expect(requireAuthCalls).toHaveLength(0)
  })

  test('does not bypass requireAuth for protected methods on same path', async () => {
    const app = makeApp()
    const res: MockResponse<any> = await invoke(app, 'POST', '/api/mixed')

    expect(res.statusCode).toBe(200)
    expect(res._getJSONData().ok).toBe('mixed-protected')
    expect(requireAuthCalls).toHaveLength(1)
    expect(requireAuthCalls[0]).toBe('POST /api/mixed')
  })

  test('returns 405 for disallowed methods (e.g., PATCH)', async () => {
    const app = makeApp()
    const res: MockResponse<any> = await invoke(app, 'PATCH', '/api/public')

    expect(res.statusCode).toBe(405)
    expect(res._getJSONData().error).toBe('Method Not Allowed')
  })

  test('bypasses requireAuth for parameterized public routes', async () => {
    const app = makeApp()
    const res: MockResponse<any> = await invoke(app, 'GET', '/api/public-item/123')

    expect(res.statusCode).toBe(200)
    expect(res._getJSONData().ok).toBe('public-123')
    expect(requireAuthCalls).toHaveLength(0)
  })

  test('calls requireAuth for parameterized protected routes', async () => {
    const app = makeApp()
    const res: MockResponse<any> = await invoke(app, 'GET', '/api/protected-item/123')

    expect(res.statusCode).toBe(200)
    expect(res._getJSONData().ok).toBe('protected-123')
    expect(requireAuthCalls).toHaveLength(1)
    expect(requireAuthCalls[0]).toBe('GET /api/protected-item/123')
  })

  test('returns 405 for disallowed methods on parameterized known routes', async () => {
    const app = makeApp()
    const res: MockResponse<any> = await invoke(app, 'PATCH', '/api/items/1')

    expect(res.statusCode).toBe(405)
    expect(res._getJSONData().error).toBe('Method Not Allowed')
  })

  test('removes skipAuth marker middleware from route handler chain', async () => {
    const app = makeApp()
    const res: MockResponse<any> = await invoke(app, 'GET', '/api/skip-marker-strip')

    expect(res.statusCode).toBe(200)
    expect(res._getJSONData().skipMarkerExecuted).toBe(false)
    expect(requireAuthCalls).toHaveLength(0)
  })

  test('keeps non-skip middleware in route handler chain', async () => {
    const app = makeApp()
    const res: MockResponse<any> = await invoke(app, 'GET', '/api/public-with-middleware')

    expect(res.statusCode).toBe(200)
    expect(res._getJSONData().normalMiddlewareExecuted).toBe(true)
    expect(requireAuthCalls).toHaveLength(0)
  })

  test('serves frontend index for mounted base path with and without trailing slash', async () => {
    const app = express()
      .disable('x-powered-by')
      .use('/statistikkregisteret', controllerRouter(requireAuth, [fakeController]))

    const invokeMountedBase = async (url: string) => {
      const req = httpMocks.createRequest({ method: 'GET', url })
      const res = httpMocks.createResponse({ eventEmitter: EventEmitter }) as MockResponse<Response>
      const sendFile = vi.fn((filePath: string) => {
        res.statusCode = 200
        res.end(filePath)
      })

      res.sendFile = sendFile as Response['sendFile']

      await new Promise<void>((resolve) => {
        const done = () => resolve()
        res.once('end', done)
        res.once('finish', done)

        app(req, res, done)
      })

      return sendFile
    }

    const withoutSlash = await invokeMountedBase('/statistikkregisteret')
    const withSlash = await invokeMountedBase('/statistikkregisteret/')

    expect(withoutSlash).toHaveBeenCalledOnce()
    expect(withSlash).toHaveBeenCalledOnce()
    expect(requireAuthCalls).toHaveLength(2)
  })

  // For now frontend serves startpage for all unknown paths
  // test('returns 404 for unknown routes with allowed method', async () => {
  //   const app = makeApp()
  //   const res: MockResponse<any> = await invoke(app, 'GET', '/statistikkregisteret/api/unknown')

  //   expect(res.statusCode).toBe(404)
  //   expect(res._getJSONData().error).toBe('Not Found')
  // })
})
