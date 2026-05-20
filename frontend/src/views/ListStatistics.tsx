import { useEffect, useState } from 'react'
import client from '../api'
import type { StatisticListing } from '@ssbno-statreg/shared'
import { PaginatedStatisticsTable } from '../components/StatisticsTable'

export default function ListStatistics() {
  const [count, setCount] = useState(20)
  const [start, setStart] = useState(0)
  const [total, setTotal] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
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

  function updateRowCount(newCount: number) {
    setCount(newCount)
    setStart(0)
  }

  function updateCurrentPage(currentPage: number) {
    setStart((currentPage - 1) * count)
  }

  return (
    <div>
      <h2>We can list many a statistics, in fact!</h2>
      <div>
        <PaginatedStatisticsTable
          start={start}
          count={count}
          total={total}
          statistics={statistics}
          updateRowCount={updateRowCount}
          setCurrentPage={updateCurrentPage}
        />
      </div>
    </div>
  )
}
