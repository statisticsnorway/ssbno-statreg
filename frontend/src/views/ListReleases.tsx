import { useState } from 'react'
import { Heading, Button } from '@digdir/designsystemet-react'
import { ArrowLeftIcon, ArrowRightIcon } from '@navikt/aksel-icons'
import { DatePicker } from '../components/DatePicker'
import { PaginatedReleaseTable, type FetchReleases } from '../components/ReleasesTable'
import { getFirstDayOfNthMonth, getLastDayOfNthMonth } from '../lib/utils'
import client from '../api'

import './ListReleases.css'

const fetchAllReleases: FetchReleases = async ({ start, count }) => {
  const { data, error } = await client.GET('/releases', { params: { query: { start, count } } })
  if (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorMessage = (error as any).error
    console.log(errorMessage)
    alert(errorMessage)
    return { releases: [], total: 0 }
  }
  return { releases: data?.releases ?? [], total: data?.total ?? 0 }
}

function ListReleases() {
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
      <PaginatedReleaseTable fetchReleases={fetchAllReleases} />
    </>
  )
}

export default ListReleases
