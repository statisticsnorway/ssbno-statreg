import express, { Router } from 'express'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import healthController from '@/api/controllers/healthController'
import { invoke } from './helpers'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}))

function createHealthApp() {
  const router = Router()
  healthController(router)
  return express().use('/api', router)
}

describe('healthController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('returns pong when the database is reachable', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([])
    const app = createHealthApp()

    const response = await invoke(app, 'GET', '/api/ping')

    expect(response.statusCode).toBe(200)
    expect(response._getJSONData()).toEqual({ status: 'ok', message: 'pong' })
    expect(prisma.$queryRaw).toHaveBeenCalledOnce()
  })

  test.each([
    new Error('database connection failed'),
    new Prisma.PrismaClientKnownRequestError('database connection failed', { code: 'P2010', clientVersion: '1.0.0' }),
  ])('returns service unavailable without exposing database errors: %s', async (error) => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(error)
    const app = createHealthApp()
    const logError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await invoke(app, 'GET', '/api/ping')

    expect(response.statusCode).toBe(503)
    expect(response._getJSONData()).toEqual({ message: 'Service unavailable' })
    expect(logError).toHaveBeenCalledOnce()
    expect(response._getData()).not.toContain('database connection failed')
  })
})
