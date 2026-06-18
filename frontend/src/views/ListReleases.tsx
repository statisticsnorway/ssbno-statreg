import { useEffect, useState, useSyncExternalStore } from 'react'
import { useSearchParams, Link as ReactRouterLink } from 'react-router'
import {
  Heading,
  Button,
  Field,
  Label,
  EXPERIMENTAL_Suggestion as Suggestion,
  type SuggestionItem,
  Chip,
  Paragraph,
  Popover,
} from '@digdir/designsystemet-react'
import { ArrowLeftIcon, ArrowRightIcon, CalendarIcon, QuestionmarkCircleIcon } from '@navikt/aksel-icons'
import { DatePicker, DatePickerColorLegend, DatePickerStatusColors } from '../components/DatePicker'
import { PaginatedReleasesTable } from '../components/ReleasesTable'
import { formatDate, getFirstDayOfNthMonth, getPublishTimeFilterForDate } from '../lib/utils'
import client from '../api'

import './ListReleases.css'
import type { ReleaseListing, ShortnameListing } from '@ssbno-statreg/shared'
import { RowCountSelect } from '../components/RowCountSelect'
import { useAuth } from '../context/AuthContext'

function useMediaQuery(mediaQuery: string): boolean {
  const getSnapshot = () => globalThis.matchMedia(mediaQuery).matches

  // Server snapshot fallback to prevent hydration errors during SSR
  const getServerSnapshot = () => false

  const subscribe = (callback: () => void) => {
    const matchMediaQueryList = globalThis.matchMedia(mediaQuery)
    matchMediaQueryList.addEventListener('change', callback)
    return () => matchMediaQueryList.removeEventListener('change', callback)
  }

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

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
  const [sortBy, setSortBy] = useState<string>('-publish_time')

  const { auth } = useAuth()
  const isUltraWideDesktop = useMediaQuery('(min-width: 1920px)')

  useEffect(() => {
    async function fetchReleases(
      start: number,
      count: number,
      selectedShortnames: SuggestionItem[],
      sortBy: string,
      selectedDate?: Date
    ) {
      const filter = {
        ...(selectedShortnames.length && {
          shortname: selectedShortnames.map((item) => item.value).join(','),
        }),
        ...getPublishTimeFilterForDate(selectedDate),
      }
      const sort = sortBy
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

  function renderCalendarList() {
    const count = isUltraWideDesktop ? 3 : 2
    const visibleCalendarOffsets = Array.from({ length: count }, (_, index) => index)

    return (
      <div className='list-releases-calendars-wrapper'>
        <Button variant='tertiary' data-size='lg' onClick={() => setCalendarMonth((prev) => prev - count)}>
          <ArrowLeftIcon />
        </Button>
        <div className='list-releases-calendars'>
          {visibleCalendarOffsets.map((offset) => (
            <DatePicker
              key={calendarMonth + offset}
              month={getFirstDayOfNthMonth(calendarMonth + offset)}
              selected={selectedDate}
              onSelect={onSelectDate}
            />
          ))}
        </div>
        <Button variant='tertiary' data-size='lg' onClick={() => setCalendarMonth((prev) => prev + count)}>
          <ArrowRightIcon />
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className='list-releases-heading-container'>
        <Heading level={1} data-size='sm'>
          Publiseringsoversikt
        </Heading>
        {auth?.isAdmin && (
          <Button asChild style={{ backgroundColor: 'var(--ds-color-base-default)' }}>
            <ReactRouterLink to='/sperredato'>
              Se sperrede datoer <CalendarIcon />
            </ReactRouterLink>
          </Button>
        )}
      </div>
      <div className='list-releases-calendars-container'>
        <div className='list-releases-calendars-title'>
          <div>
            <Heading level={2} data-size='xs'>
              Publiseringskalender
            </Heading>
            <Paragraph data-size='md'>Filtrer publiseringsoversikten ved å klikke på dato</Paragraph>
          </div>
          <Popover.TriggerContext>
            <Popover.Trigger inline className='list-releases-color-legend-popover'>
              Fargeforklaring
              <QuestionmarkCircleIcon fontSize={24} />
            </Popover.Trigger>
            <Popover data-color='neutral' data-placement='right'>
              <DatePickerColorLegend statusColors={DatePickerStatusColors} />
            </Popover>
          </Popover.TriggerContext>
        </div>
        {renderCalendarList()}
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
