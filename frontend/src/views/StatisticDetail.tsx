import { useEffect, useState } from 'react'
import client from '../api'
import type { StatisticDetails } from '@ssbno-statreg/shared'

function StatisticDetail() {
  const [statistic, setStatistics] = useState<StatisticDetails>({})

  useEffect(() => {
    async function fetchStatistic() {
      const { data, error } = await client.GET('/statistics/{shortname}', { params: { path: { shortname: 'energ' } } })
      if (error) {
        console.log(error)
        alert(error)
      } else {
        setStatistics(data)
      }
    }
    fetchStatistic()
  }, [])

  return (
    <div>
      <h1>Statistic {statistic.shortname}</h1>
      Navn: {statistic.name}<br />
      Status: {statistic.status?.code}
    </div>
  )
}

export default StatisticDetail
