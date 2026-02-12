import type { Router } from 'express'
import { fetchUsersByInitials } from '@/../plugins/entraReaderClient'
import { skipAuth } from 'plugins/authMiddleware'

export default function entraReaderController(router: Router) {
  router.get('/entra/users/:ids', skipAuth, async (req, res) => {
    const result = await fetchUsersByInitials(req.params.ids)
    res.json(result)
  })
}
