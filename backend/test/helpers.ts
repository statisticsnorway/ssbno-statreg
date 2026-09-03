import { type Express } from 'express'
import httpMocks from 'node-mocks-http'
import { EventEmitter } from 'node:events'
import type { MockResponse } from 'node-mocks-http'
import type { RequestHandler, Response } from 'express'

export function createMockResponse(): MockResponse<Response> {
  return httpMocks.createResponse({ eventEmitter: EventEmitter }) as MockResponse<Response>
}

export function makeSkipAuthMarker(): RequestHandler & { __skipAuth?: boolean } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const marker: any = (_req: any, _res: any, next: any) => next()
  marker.__skipAuth = true
  return marker
}

export async function invoke(
  app: Express,
  method: string,
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any,
  res: MockResponse<Response> = createMockResponse()
): Promise<MockResponse<Response>> {
  const req = httpMocks.createRequest({ url, body })
  req._setMethod(method)

  await new Promise<void>((resolve) => {
    const done = () => resolve()
    res.once('end', done)
    res.once('finish', done)

    app(req, res, done)
  })

  return res
}
