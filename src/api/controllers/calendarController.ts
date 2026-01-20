///calendar/post_calendar_blocked_release_days__date_

//import { prisma } from '@/lib/prisma'
import { createBlockedReleaseDay } from '@/services/calendarService'
import { Router } from 'express'
import { skipAuth } from 'plugins/authMiddleware'

export default function calendarController(router: Router) {
  router.post('/calendar/blocked-release-days/:date', skipAuth, async (req, res) => {
    console.log('Post blocked', req.body)
    const { blocked_comment } = req.body
    const date = req.params.date
    const result = createBlockedReleaseDay(date, blocked_comment);
    // logic in service
    /*const result = await prisma.calender_date.create({
      data: {
        id: 2,
        version: 0,
        comment: blocked_comment,
        day: new Date(date),
      },
    })*/
    res.json(result)
  })
}
