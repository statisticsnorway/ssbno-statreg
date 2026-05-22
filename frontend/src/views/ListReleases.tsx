import { useEffect, useState } from 'react'
import {
  Heading,
  Button,
  Field,
  Label,
  EXPERIMENTAL_Suggestion as Suggestion,
  type SuggestionItem,
} from '@digdir/designsystemet-react'
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    async function fetchReleases(start: number, count: number, selectedShortnames: string[], selectedDate?: Date) {
      let publishTimeFilter = {}
      if (selectedDate) {
        const fromTime = new Date(selectedDate)
        fromTime.setHours(0, 0, 0, 0)
        const toTime = new Date(selectedDate)
        toTime.setHours(23, 59, 59, 999)
        publishTimeFilter = {
          publish_time_after: fromTime.toISOString(),
          publish_time_before: toTime.toISOString(),
        }
      }
      const filter = {
        ...(selectedShortnames.length && {
          shortname: selectedShortnames.join(','),
        }),
        ...publishTimeFilter,
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
    fetchReleases(start, rowCount, selectedShortnames, selectedDate)
  }, [start, rowCount, selectedShortnames, selectedDate])

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

  function onSelectDate(date?: Date) {
    setSelectedDate(date ?? undefined)
  }

  function filterChanged(selected: SuggestionItem[]) {
    const selectedShortnames: string[] = []
    selected.forEach((item) => {
      if (item.value.startsWith('shortname_')) {
        selectedShortnames.push(item.value.replace('shortname_', ''))
      }
      // add handeling for removal of selected date
    })
    setSelectedShortnames(selectedShortnames)
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
          <DatePicker
            fromDate={getFirstDayOfNthMonth(calendarMonth)}
            toDate={getLastDayOfNthMonth(calendarMonth)}
            selected={selectedDate}
            onSelect={onSelectDate}
          />
          <DatePicker
            fromDate={getFirstDayOfNthMonth(calendarMonth + 1)}
            toDate={getLastDayOfNthMonth(calendarMonth + 1)}
            selected={selectedDate}
            onSelect={onSelectDate}
          />
          <DatePicker
            fromDate={getFirstDayOfNthMonth(calendarMonth + 2)}
            toDate={getLastDayOfNthMonth(calendarMonth + 2)}
            selected={selectedDate}
            onSelect={onSelectDate}
            showColorCodingExplanation
          />
        </div>
      </div>
      Valgt dag: {selectedDate ? selectedDate.toLocaleDateString('no-NO') : 'Ingen dag valgt'}
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
          <Suggestion multiple onSelectedChange={(selected) => filterChanged(selected)}>
            <Suggestion.Input />
            <Suggestion.Clear />
            <Suggestion.List>
              <Suggestion.Empty>Ingen treff</Suggestion.Empty>
              {shortnames.map((shortname) => (
                <Suggestion.Option
                  key={shortname.shortname}
                  label={shortname.shortname}
                  value={`shortname_${shortname.shortname}`}
                >
                  {shortname.shortname}, {shortname.statistic_name}
                </Suggestion.Option>
              ))}
            </Suggestion.List>
          </Suggestion>
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
