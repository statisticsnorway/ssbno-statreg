import type { Router } from 'express'
import { fetchUserByEmail } from '@/../plugins/entraReaderClient'
import { skipAuth } from 'plugins/authMiddleware'

export default function entraReaderController(router: Router) {
  router.get('/entra/users/:email', skipAuth, async (req, res) => {
    //remeber to remove skipAuth and add requireUserAuthentication
    const user = await fetchUserByEmail(req.params.email)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  })
}
