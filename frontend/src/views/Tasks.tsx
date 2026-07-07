import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  Heading,
  Divider,
  Field,
  Label,
  EXPERIMENTAL_Suggestion as Suggestion,
  type SuggestionItem,
} from '@digdir/designsystemet-react'

import client from '../api'

import './ListReleases.css'

import { useAuth } from '../context/AuthContext'
import { RowCountSelect } from '../components/RowCountSelect'
import { PaginatedReleasesTable } from '../components/ReleasesTable'
import { ErrorAlert } from '../components/ErrorAlert'
import ErrorPage, { ErrorType } from './ErrorPage'

import type { ReleaseListing, ShortnameListing } from '@ssbno-statreg/shared'

export default function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams()
  const shortnamesQuery = searchParams.get('shortname')
  const sortQuery = searchParams.get('sort')
  const [rowCount, setRowCount] = useState(10)
  const [start, setStart] = useState(0)
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [total, setTotal] = useState(0)
  const [shortnames, setShortnames] = useState<ShortnameListing[]>([])
  const [apiError, setApiError] = useState<string[]>([])

  const { auth } = useAuth()
  const isAdmin = auth?.isAdmin

  const selectedShortnames = useMemo<SuggestionItem[]>(() => {
    if (!shortnamesQuery) return []

    return shortnamesQuery.split(',').map((shortname) => ({
      label: shortname,
      value: shortname,
    }))
  }, [shortnamesQuery])

  const releaseQuery = useMemo(
    () => ({
      start,
      count: rowCount,
      ...(selectedShortnames.length && {
        shortname: selectedShortnames.map((shortname) => shortname.value).join(','),
      }),
      sort: sortQuery ?? '',
    }),
    [start, rowCount, selectedShortnames, sortQuery]
  )

  useEffect(() => {
    async function fetchReleases() {
      if (!isAdmin) return
      const { data, error } = await client.GET('/releases', {
        params: {
          query: releaseQuery,
        },
      })

      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        console.log(errorMessage)
        setApiError((prev) => [...prev, errorMessage])
      } else {
        setReleases(data.releases ?? [])
        setTotal(data.total ?? 0)
      }
    }
    fetchReleases()
  }, [isAdmin, releaseQuery])

  useEffect(() => {
    async function fetchShortnames() {
      if (!isAdmin) return
      const { data, error } = await client.GET('/shortnames')
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        console.log(errorMessage)
        setApiError((prev) => [...prev, errorMessage])
      } else {
        setShortnames(data ?? [])
      }
    }
    fetchShortnames()
  }, [isAdmin])

  function updateRowCount(newCount: number) {
    setRowCount(newCount)
    setStart(0)
  }

  function setCurrentPage(currentPage: number) {
    setStart((currentPage - 1) * rowCount)
  }

  function updateFilters({ shortnames }: { shortnames?: string[] }) {
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

  function onFilterChange(selected: SuggestionItem | SuggestionItem[] | null) {
    if (!selected) return
    const selectedShortnames = Array.isArray(selected) ? selected : [selected]

    updateFilters({
      shortnames: selectedShortnames.map((item) => item.value),
    })
  }

  if (!isAdmin) return <ErrorPage type={ErrorType.NOTAUTH} />

  return (
    <>
      {apiError.length > 0 && <ErrorAlert message={apiError} />}
      <Heading level={2} data-size='sm'>
        Oppgaver
      </Heading>

      {/* TODO: MIM-2873: Add task list table */}

      <Divider />

      <Heading level={3} data-size='xs'>
        Publiseringsoversikt
      </Heading>
      <div className='list-releases-filter-container'>
        <Field>
          <Label>Søk og filtrer</Label>
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
