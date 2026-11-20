import { Router } from 'express'
import { skipAuth } from '@/../plugins/authMiddleware'

export default function healthController(router: Router) {
  router.get('/ping', skipAuth, async (_req, res) => {
    res.status(200).json({
      status: 'ok',
      message: 'pong',
    })
  })
}
