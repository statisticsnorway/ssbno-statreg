import { describe, test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import express, { Router, type RequestHandler } from 'express'
import controllerRouter from '@/api/core/controllerRouter'
import { invoke, makeSkipAuthMarker } from './helpers'
import { MockResponse } from 'node-mocks-http'

describe('controllerRouter integration testing: ', () => {
  describe('controllerRouter ', () => {
    let requireAuthCalls: string[]
    let requireAuth: RequestHandler

    const fakeController = (router: Router) => {
      const skip = makeSkipAuthMarker()

      router.get('/public', skip, (_req, res) => res.json({ ok: 'public' }))
      router.get('/protected', (_req, res) => res.json({ ok: 'protected' }))
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

      assert.equal(res.statusCode, 200)
      assert.equal(res._getJSONData().ok, 'protected')
      assert.equal(requireAuthCalls.length, 1)
      assert.equal(requireAuthCalls[0], 'GET /protected')
    })

    test('bypasses requireAuth on public routes', async () => {
      const app = makeApp()
      const res: MockResponse<any> = await invoke(app, 'GET', '/public')

      assert.equal(res.statusCode, 200)
      assert.equal(res._getJSONData().ok, 'public')
      assert.equal(requireAuthCalls.length, 0)
    })

    test('returns 405 for disallowed methods (e.g., PATCH)', async () => {
      const app = makeApp()
      const res: MockResponse<any> = await invoke(app, 'PATCH', '/public')

      assert.equal(res.statusCode, 405)
      assert.equal(res._getJSONData().error, 'Method Not Allowed')
    })

    test('returns 404 for unknown routes with allowed method', async () => {
      const app = makeApp()
      const res: MockResponse<any> = await invoke(app, 'GET', '/unknown')

      assert.equal(res.statusCode, 404)
      assert.equal(res._getJSONData().error, 'Not Found')
    })
  })
})
