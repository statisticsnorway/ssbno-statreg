import { useEffect, useState } from 'react'
import { Heading, Button } from '@digdir/designsystemet-react'
import { ArrowLeftIcon, ArrowRightIcon } from '@navikt/aksel-icons'
import { DatePicker } from '../components/DatePicker'
import { PaginatedReleasesTable } from '../components/ReleasesTable'
import { getFirstDayOfNthMonth, getLastDayOfNthMonth } from '../lib/utils'
import client from '../api'

import './ListReleases.css'
import type { ReleaseListing } from '@ssbno-statreg/shared'

function ListReleases() {
  const [rowCount, setRowCount] = useState(10)
  const [start, setStart] = useState(0)
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState(undefined)

  useEffect(() => {
    fetchReleases(start, rowCount, sortBy)
  }, [start, rowCount, sortBy])

  const fetchReleases = async (start: number, count: number, sort: string[] | undefined) => {
    const { data, error } = await client.GET('/releases', { params: { query: { start, count, sort } } })
    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (error as any).error
      console.log(errorMessage)
      alert(errorMessage)
    } else {
      setReleases(data.releases ?? [])
      setTotal(data.total ?? 0)
    }
  }

  function updateRowCount(newCount: number) {
    setRowCount(newCount)
    setStart(0)
  }

  function setCurrentPage(currentPage: number) {
    setStart((currentPage - 1) * rowCount)
  }

  const [calendarMonth, setCalendarMonth] = useState(0)

  return (
    <>
      <Heading level={1} data-size='sm'>
        Publiseringsoversikt
      </Heading>

      <div className='list-releases-calendars-container'>
        <Heading level={2} data-size='xs'>
          Publiseringskalender
        </Heading>
        <div className='list-releases-calendars-buttons'>
          <Button variant='tertiary' onClick={() => setCalendarMonth((prev) => prev - 3)}>
            <ArrowLeftIcon /> Forrige
          </Button>
          <Button variant='tertiary' onClick={() => setCalendarMonth((prev) => prev + 3)}>
            Neste <ArrowRightIcon />
          </Button>
        </div>
        <div className='list-releases-calendars-wrapper'>
          <DatePicker fromDate={getFirstDayOfNthMonth(calendarMonth)} toDate={getLastDayOfNthMonth(calendarMonth)} />
          <DatePicker
            fromDate={getFirstDayOfNthMonth(calendarMonth + 1)}
            toDate={getLastDayOfNthMonth(calendarMonth + 1)}
          />
          <DatePicker
            fromDate={getFirstDayOfNthMonth(calendarMonth + 2)}
            toDate={getLastDayOfNthMonth(calendarMonth + 2)}
            showColorCodingExplanation
          />
        </div>
      </div>
      <PaginatedReleasesTable
        start={start}
        count={rowCount}
        total={total}
        releases={releases}
        updateRowCount={updateRowCount}
        setCurrentPage={setCurrentPage}
        setSortBy={setSortBy}
      />
    </>
  )
}

export default ListReleases
