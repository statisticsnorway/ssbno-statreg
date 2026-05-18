import { useEffect, useState } from 'react'
import { Heading, Button, Field, Label, EXPERIMENTAL_Suggestion } from '@digdir/designsystemet-react'
import { ArrowLeftIcon, ArrowRightIcon } from '@navikt/aksel-icons'
import { DatePicker } from '../components/DatePicker'
import { PaginatedReleasesTable } from '../components/ReleasesTable'
import { getFirstDayOfNthMonth, getLastDayOfNthMonth } from '../lib/utils'
import client from '../api'

import './ListReleases.css'
import type { ReleaseListing } from '@ssbno-statreg/shared'

const fetchreleases = {
  total: 15,
  releases: [
    {
      id: 1,
      publish_time: '2026-10-26T08:00:00.000Z',
      approval_status: 'FORSLAG',
      period_to: '2025-12-31',
      period_from: '2025-01-01',
      statistic: {
        shortname: 'energ',
        name: 'Energiregnskap og energibalanse',
        name_en: 'Energy account and energy balance',
      },
      frequency: {
        name: 'Uke',
        code: 'W',
      },
    },
    {
      id: 14,
      publish_time: '2026-07-24T06:00:00.000Z',
      approval_status: 'FORSLAG',
      period_to: '2026-05-29',
      period_from: '2026-05-18',
      statistic: {
        shortname: 'kpi',
        name: 'Utenrikshandel og varestrøm',
        name_en: 'Foreign trade and goods flow',
      },
      frequency: {
        name: 'Uke',
        code: 'W',
      },
    },
    {
      id: 11,
      publish_time: '2026-07-24T06:00:00.000Z',
      approval_status: 'FORSLAG',
      period_to: '2026-05-31',
      period_from: '2026-05-04',
      statistic: {
        shortname: 'kpi',
        name: 'Utenrikshandel og varestrøm',
        name_en: 'Foreign trade and goods flow',
      },
      frequency: {
        name: 'Uke',
        code: 'W',
      },
    },
    {
      id: 12,
      publish_time: '2026-05-29T06:00:00.000Z',
      approval_status: 'FORSLAG',
      period_to: '2026-05-21',
      period_from: '2026-05-20',
      statistic: {
        shortname: 'kpi',
        name: 'Utenrikshandel og varestrøm',
        name_en: 'Foreign trade and goods flow',
      },
      frequency: {
        name: 'Uke',
        code: 'W',
      },
    },
    {
      id: 13,
      publish_time: '2026-05-29T06:00:00.000Z',
      approval_status: 'FORSLAG',
      period_to: '2026-05-21',
      period_from: '2026-05-20',
      statistic: {
        shortname: 'kpi',
        name: 'Utenrikshandel og varestrøm',
        name_en: 'Foreign trade and goods flow',
      },
      frequency: {
        name: 'Uke',
        code: 'W',
      },
    },
    {
      id: 15,
      publish_time: '2026-05-28T06:00:00.000Z',
      approval_status: 'FORSLAG',
      period_to: '2026-05-01',
      period_from: '2026-04-01',
      statistic: {
        shortname: 'kpi',
        name: 'Utenrikshandel og varestrøm',
        name_en: 'Foreign trade and goods flow',
      },
      frequency: {
        name: 'Uke',
        code: 'W',
      },
    },
    {
      id: 7,
      publish_time: '2026-05-26T08:00:00.000Z',
      approval_status: 'GODKJENT',
      period_to: '2025-12-31',
      period_from: '2025-01-01',
      statistic: {
        shortname: 'kpi',
        name: 'Utenrikshandel og varestrøm',
        name_en: 'Foreign trade and goods flow',
      },
      frequency: {
        name: 'Uke',
        code: 'W',
      },
    },
    {
      id: 6,
      publish_time: '2026-03-26T08:00:00.000Z',
      approval_status: 'GODKJENT',
      period_to: '2025-12-31',
      period_from: '2025-01-01',
      statistic: {
        shortname: 'befolk',
        name: 'Befolkning og demografi',
        name_en: 'Population and demography',
      },
      frequency: {
        name: 'Måned',
        code: 'M',
      },
    },
    {
      id: 2,
      publish_time: '2026-01-26T08:00:00.000Z',
      approval_status: 'GODKJENT',
      period_to: '2025-12-31',
      period_from: '2025-01-01',
      statistic: {
        shortname: 'energ',
        name: 'Energiregnskap og energibalanse',
        name_en: 'Energy account and energy balance',
      },
      frequency: {
        name: 'Uke',
        code: 'W',
      },
    },
    {
      id: 3,
      publish_time: '2026-01-26T08:00:00.000Z',
      approval_status: 'GODKJENT',
      period_to: '2025-12-31',
      period_from: '2025-01-01',
      statistic: {
        shortname: 'energ',
        name: 'Energiregnskap og energibalanse',
        name_en: 'Energy account and energy balance',
      },
      frequency: {
        name: 'Uke',
        code: 'W',
      },
    },
  ],
}

function ListReleases() {
  const [rowCount, setRowCount] = useState(10)
  const [start, setStart] = useState(0)
  const [releases, setReleases] = useState<ReleaseListing[]>(fetchreleases.releases)
  const [total, setTotal] = useState(fetchreleases.total)

  useEffect(() => {
    fetchReleases(start, rowCount)
  }, [start, rowCount])

  const fetchReleases = async (start: number, count: number) => {
    const { data, error } = await client.GET('/releases', { params: { query: { start, count } } })
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

  function updatedRowCount(newCount: number) {
    setRowCount(newCount)
    setStart(1)
  }

  function setCurrentPage(currentPage: number) {
    setStart((currentPage - 1) * rowCount)
  }

  // TODO MIM-2712: Get list from backend
  const shortnames = [
    {
      shortname: 'energ',
      statistic_name: 'Energiregnskap og energibalanse',
    },
    {
      shortname: 'befolk',
      statistic_name: 'Befolkning og demografi',
    },
    {
      shortname: 'kpi',
      statistic_name: 'Utenrikshandel og varestrøm',
    },
    {
      shortname: 'syssel',
      statistic_name: 'Sysselsetting og arbeidsledighet',
    },
    {
      shortname: 'helse',
      statistic_name: 'Helse og helsetjenester',
    },
  ]
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
      <Field>
        <Label>Filtrer publiseringer</Label>
        <EXPERIMENTAL_Suggestion multiple>
          <EXPERIMENTAL_Suggestion.Input />
          <EXPERIMENTAL_Suggestion.Clear />
          <EXPERIMENTAL_Suggestion.List>
            <EXPERIMENTAL_Suggestion.Empty>Ingen treff</EXPERIMENTAL_Suggestion.Empty>
            {shortnames.map((shortname) => (
              <EXPERIMENTAL_Suggestion.Option
                key={shortname.shortname}
                label={shortname.shortname}
                value={shortname.shortname}
              >
                {shortname.shortname}, {shortname.statistic_name}
              </EXPERIMENTAL_Suggestion.Option>
            ))}
          </EXPERIMENTAL_Suggestion.List>
        </EXPERIMENTAL_Suggestion>
      </Field>
      <PaginatedReleasesTable
        start={start}
        count={rowCount}
        total={total}
        releases={releases}
        updatedRowCount={updatedRowCount}
        setCurrentPage={setCurrentPage}
      />
    </>
  )
}

export default ListReleases
