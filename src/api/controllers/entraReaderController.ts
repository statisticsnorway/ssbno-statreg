import type { Router } from 'express'
import { fetchUserByEmail } from '@/../plugins/entraReaderClient'
import { skipAuth } from 'plugins/authMiddleware'

export default function entraReaderController(router: Router) {
  router.get('/entra/users/:ids', skipAuth, async (req, res) => {
    // TODO: remember to remove skipAuth and add requireUserAuthentication
    const ids = req.params.ids
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)

    if (ids.length === 0) {
      return res.status(400).json({ error: 'No user ids provided' })
    }

    const users = await Promise.all(ids.map((id) => fetchUserByEmail(id)))

    res.json(users.filter((u) => u !== null))
  })
}
