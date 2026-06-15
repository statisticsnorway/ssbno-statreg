import './ListStatistics.css'
import { useEffect, useState } from 'react'
import client from '../api'
import type { StatisticListing } from '@ssbno-statreg/shared'
import { PaginatedStatisticsTable } from '../components/StatisticsTable'
import { Heading, Button } from '@digdir/designsystemet-react'
import { Link as ReactRouterLink } from 'react-router'
import { PlusCircleIcon } from '@navikt/aksel-icons'
import { useAuth } from '../context/AuthContext'

export default function ListStatistics() {
  const [count, setCount] = useState(20)
  const [start, setStart] = useState(0)
  const [total, setTotal] = useState(0)
  const [statistics, setStatistics] = useState<StatisticListing[]>([])
  const { auth } = useAuth()

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
      setStatistics(data.statistics ?? [])
      setTotal(data.total ?? 0)
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
    <div className='list-statistics-container'>
      <div className='list-statistics-header'>
        <Heading level={1} data-size='sm'>
          Statistikkoversikt
        </Heading>
        {auth?.isAdmin && (
          <Button datas-size='md' asChild>
            <ReactRouterLink to='/statistikk/opprett' reloadDocument>
              Opprett ny statistikk <PlusCircleIcon />
            </ReactRouterLink>
          </Button>
        )}
      </div>
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
