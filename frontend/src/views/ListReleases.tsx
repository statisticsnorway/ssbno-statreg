import { useEffect, useState } from 'react'
import { Heading, Button, Field, Label, EXPERIMENTAL_Suggestion } from '@digdir/designsystemet-react'
import { ArrowLeftIcon, ArrowRightIcon } from '@navikt/aksel-icons'
import { DatePicker } from '../components/DatePicker'
import { PaginatedReleasesTable } from '../components/ReleasesTable'
import { getFirstDayOfNthMonth, getLastDayOfNthMonth } from '../lib/utils'
import client from '../api'

import './ListReleases.css'
import type { ReleaseListing, ShortnameListing } from '@ssbno-statreg/shared'
import { RowCountSelect } from '../components/RowCountSelect'

function ListReleases() {
  const [rowCount, setRowCount] = useState(10)
  const [start, setStart] = useState(0)
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [total, setTotal] = useState(0)
  const [calendarMonth, setCalendarMonth] = useState(0)
  const [shortnames, setShortnames] = useState<ShortnameListing[]>([])
  // eslint-disable-next-line @eslint-react/no-unused-state
  const [selectedShortnames, setSelectedShortnames] = useState<string[]>([])

  useEffect(() => {
    async function fetchReleases(start: number, count: number, selectedShortnames: string[]) {
      const filter = {
        ...(selectedShortnames.length && {
          shortname: selectedShortnames.join(','),
        }),
      }
      const { data, error } = await client.GET('/releases', {
        params: { query: { start, count, ...filter } },
      })
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
    fetchReleases(start, rowCount, selectedShortnames)
  }, [start, rowCount, selectedShortnames])

  useEffect(() => {
    async function fetchShortnames() {
      const { data, error } = await client.GET('/shortnames')
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setShortnames(data ?? [])
      }
    }
    fetchShortnames()
  }, [])

  function updateRowCount(newCount: number) {
    setRowCount(newCount)
    setStart(0)
  }

  function setCurrentPage(currentPage: number) {
    setStart((currentPage - 1) * rowCount)
  }

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 'var(--ds-size-8)',
          width: '100%',
        }}
      >
        <Field>
          <Label>Filtrer publiseringer</Label>
          <EXPERIMENTAL_Suggestion
            multiple
            onSelectedChange={(selected) => setSelectedShortnames(selected.map((selectedItem) => selectedItem.value))}
          >
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
        <RowCountSelect selectedRowCount={rowCount} updateRowCount={updateRowCount} />
      </div>
      <PaginatedReleasesTable
        start={start}
        count={rowCount}
        total={total}
        releases={releases}
        setCurrentPage={setCurrentPage}
      />
    </>
  )
}

export default ListReleases
