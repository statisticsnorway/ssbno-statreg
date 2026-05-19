import { useEffect, useState } from 'react'
import client from '../api'
import type { StatisticListing } from '@ssbno-statreg/shared'

export default function ListStatistics() {
  const [count, setCount] = useState(20)
  const [start, setStart] = useState(0)
  const [statistics, setStatistics] = useState<StatisticListing[]>([])
  useEffect(() => {
    fetchStatistics(start, count)
  }, [start, count])

  const fetchStatistics = async (start: number, count: number) => {
    const { data, error } = await client.GET('/statistics', { params: { query: { start, count } } })
    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (error as any).error
      console.log(errorMessage)
      alert(errorMessage)
    } else {
      setStatistics(data)
    }
  }

  return (
    <div>
      <h1>We can list a statistics!</h1>
      <div>
        
      </div>
    </div>
  )
}
