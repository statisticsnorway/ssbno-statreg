import { useEffect, useState } from 'react'
import { useSearchParams, Link as ReactRouterLink } from 'react-router'
import {
  Heading,
  Button,
  Field,
  Label,
  EXPERIMENTAL_Suggestion as Suggestion,
  type SuggestionItem,
  Chip,
} from '@digdir/designsystemet-react'
import { ArrowLeftIcon, ArrowRightIcon, CalendarIcon } from '@navikt/aksel-icons'
import { DatePicker } from '../components/DatePicker'
import { PaginatedReleasesTable } from '../components/ReleasesTable'
import { formatDate, getFirstDayOfNthMonth, getPublishTimeFilterForDate } from '../lib/utils'
import client from '../api'

import './ListReleases.css'
import type { ReleaseListing, ShortnameListing } from '@ssbno-statreg/shared'
import { RowCountSelect } from '../components/RowCountSelect'

function ListReleases() {
  const [searchParams] = useSearchParams()
  const shortnamesQuery = searchParams.get('shortname')
  const [rowCount, setRowCount] = useState(10)
  const [start, setStart] = useState(0)
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [total, setTotal] = useState(0)
  const [calendarMonth, setCalendarMonth] = useState(0)
  const [shortnames, setShortnames] = useState<ShortnameListing[]>([])

  const [selectedShortnames, setSelectedShortnames] = useState<SuggestionItem[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [sortBy, setSortBy] = useState<string[]>(['-publish_time'])

  useEffect(() => {
    async function fetchReleases(
      start: number,
      count: number,
      selectedShortnames: SuggestionItem[],
      sortBy: string[],
      selectedDate?: Date
    ) {
      const filter = {
        ...(selectedShortnames.length && {
          shortname: selectedShortnames.map((item) => item.value).join(','),
        }),
        ...getPublishTimeFilterForDate(selectedDate),
      }
      const sort = sortBy.join(',')
      const { data, error } = await client.GET('/releases', {
        params: { query: { start, count, ...filter, sort } },
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
    fetchReleases(start, rowCount, selectedShortnames, sortBy, selectedDate)
  }, [start, rowCount, selectedShortnames, sortBy, selectedDate])

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

  useEffect(() => {
    async function setSelectedShortnamesFromQuery() {
      if (!shortnamesQuery) return

      const newSelectedShortnames = shortnamesQuery.split(',').map((shortname) => ({
        label: shortname,
        value: shortname,
      }))
      setSelectedShortnames(newSelectedShortnames)
    }
    setSelectedShortnamesFromQuery()
  }, [shortnamesQuery])

  function updateRowCount(newCount: number) {
    setRowCount(newCount)
    setStart(0)
  }

  function setCurrentPage(currentPage: number) {
    setStart((currentPage - 1) * rowCount)
  }

  function onSelectDate(date?: Date) {
    setSelectedDate(date ?? undefined)
    setSelectedShortnames([])
  }

  function filterChanged(selected: SuggestionItem[]) {
    setSelectedShortnames(selected)
    setSelectedDate(undefined)
  }

  return (
    <>
      <div className='list-releases-heading-container'>
        <Heading level={1} data-size='sm'>
          Publiseringsoversikt
        </Heading>
        <Button asChild style={{ backgroundColor: 'var(--ds-color-base-default)' }}>
          <ReactRouterLink to='/sperredato'>
            Se sperrede datoer <CalendarIcon />
          </ReactRouterLink>
        </Button>
      </div>
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
          <DatePicker month={getFirstDayOfNthMonth(calendarMonth)} selected={selectedDate} onSelect={onSelectDate} />
          <DatePicker
            month={getFirstDayOfNthMonth(calendarMonth + 1)}
            selected={selectedDate}
            onSelect={onSelectDate}
          />
          <DatePicker
            month={getFirstDayOfNthMonth(calendarMonth + 2)}
            selected={selectedDate}
            onSelect={onSelectDate}
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
          {selectedDate && (
            <Chip.Removable
              aria-label={`Slett valgt dag: ${formatDate(selectedDate.toISOString())}`}
              onClick={() => onSelectDate()}
            >
              {formatDate(selectedDate.toISOString())}
            </Chip.Removable>
          )}
          <Suggestion multiple onSelectedChange={(selected) => filterChanged(selected)} selected={selectedShortnames}>
            <Suggestion.Input />
            <Suggestion.Clear />
            <Suggestion.List>
              <Suggestion.Empty>Ingen treff</Suggestion.Empty>
              {shortnames.map((shortname) => (
                <Suggestion.Option key={shortname.shortname} label={shortname.shortname} value={shortname.shortname}>
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
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
    </>
  )
}

export default ListReleases
