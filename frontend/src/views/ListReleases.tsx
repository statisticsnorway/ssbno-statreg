import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
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
import { ErrorAlert } from '../components/ErrorAlert'

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

export default function ListReleases() {
  const [searchParams, setSearchParams] = useSearchParams()
  const shortnamesQuery = searchParams.get('shortname')
  const publishTimeAfterQuery = searchParams.get('publish_time_after')
  const sortQuery = searchParams.get('sort')
  const [rowCount, setRowCount] = useState(10)
  const [start, setStart] = useState(0)
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [total, setTotal] = useState(0)
  const [calendarMonth, setCalendarMonth] = useState(0)
  const [shortnames, setShortnames] = useState<ShortnameListing[]>([])
  const [apiError, setApiError] = useState<string[]>([])
  const [calendarApiError, setCalendarApiError] = useState<string>('')

  const selectedDate = useMemo(
    () => (publishTimeAfterQuery ? new Date(publishTimeAfterQuery) : undefined),
    [publishTimeAfterQuery]
  )

  const selectedShortnames = useMemo<SuggestionItem[]>(() => {
    if (!shortnamesQuery) return []

    return shortnamesQuery.split(',').map((shortname) => ({
      label: shortname,
      value: shortname,
    }))
  }, [shortnamesQuery])

  const { auth } = useAuth()
  const isUltraWideDesktop = useMediaQuery('(min-width: 1920px)')

  const releaseQuery = useMemo(
    () => ({
      start,
      count: rowCount,
      ...(selectedShortnames.length && {
        shortname: selectedShortnames.map((shortname) => shortname.value).join(','),
      }),
      ...getPublishTimeFilterForDate(selectedDate),
      sort: sortQuery ?? '',
    }),
    [start, rowCount, selectedShortnames, selectedDate, sortQuery]
  )

  useEffect(() => {
    async function fetchReleases() {
      const { data, error } = await client.GET('/releases', {
        params: {
          query: releaseQuery,
        },
      })

      if (error) {
        setApiError((prev) => [...prev, error.error])
        return
      }

      setReleases(data.releases ?? [])
      setTotal(data.total ?? 0)
    }
    fetchReleases()
  }, [releaseQuery])

  useEffect(() => {
    async function fetchShortnames() {
      const { data, error } = await client.GET('/shortnames')

      if (error) {
        setApiError((prev) => [...prev, error.error])
        return
      }

      setShortnames(data ?? [])
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

  function updateFilters({ shortnames, date }: { shortnames?: string[]; date?: Date }) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)

      if (shortnames) {
        next.delete('shortname')
        next.delete('publish_time_after')
        next.delete('publish_time_before')

        if (shortnames.length) {
          next.set('shortname', shortnames.join(','))
        }
      }

      if (date) {
        next.delete('publish_time_after')
        next.delete('publish_time_before')
        next.delete('shortname')

        const filter = getPublishTimeFilterForDate(date)

        if (filter.publish_time_after) {
          next.set('publish_time_after', filter.publish_time_after)
        }

        if (filter.publish_time_before) {
          next.set('publish_time_before', filter.publish_time_before)
        }
      }

      return next
    })
  }

  function onSortChange(newSortBy: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (newSortBy) {
        next.set('sort', newSortBy)
      } else {
        next.delete('sort')
      }
      return next
    })
  }

  function onSelectDate(date?: Date) {
    updateFilters({
      shortnames: [],
      date,
    })
  }

  function onFilterChange(selected: SuggestionItem | SuggestionItem[] | null) {
    if (!selected) return
    const selectedShortnames = Array.isArray(selected) ? selected : [selected]

    updateFilters({
      shortnames: selectedShortnames.map((item) => item.value),
    })
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
              apiErrorEmit={setCalendarApiError}
            />
          ))}
        </div>
        <Button variant='tertiary' data-size='lg' onClick={() => setCalendarMonth((prev) => prev + count)}>
          <ArrowRightIcon />
        </Button>
      </div>
    )
  }

  const errorsCombined = [...apiError, calendarApiError].filter(Boolean)

  return (
    <>
      {errorsCombined.length > 0 && <ErrorAlert message={errorsCombined} />}
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
      <div className='list-releases-filter-container'>
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
          <Suggestion multiple onSelectedChange={(selected) => onFilterChange(selected)} selected={selectedShortnames}>
            <Suggestion.Input />
            <Suggestion.Clear onClick={() => onFilterChange(null)} />
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
        sortBy={sortQuery ?? undefined}
        setSortBy={onSortChange}
      />
    </>
  )
}
