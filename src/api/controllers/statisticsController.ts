import { Router } from 'express'

const router = Router()

router.get('/statistics', async (_req, res) => {
  try {
    const data = {
      id: 137311,
      shortName: 'aap',
      name: 'Arbeidsavklaringspenger',
      nameEN: 'Work assessment allowance',
      dateCreated: '2018-11-16T11:18:37Z',
      lang: 'nb',
      ownerCode: '350',
      owner: 'Seksjon for inntekts- og levekårsstatistikk',
      status: 'A',
      regionalLevels: 'Kommune',
      variants: 'År',
      annualReporting: false,
      startYear: '2015',
      firstReleaseStatistic: '2018-12-03T07:00:00Z',
      changes: [],
    }
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
