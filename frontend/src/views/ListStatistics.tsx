import './ListStatistics.css'
import { useEffect, useState } from 'react'
import client from '../api'
import type { ShortnameListing, StatisticListing } from '@ssbno-statreg/shared'
import { PaginatedStatisticsTable } from '../components/StatisticsTable'
import {
  EXPERIMENTAL_Suggestion as Suggestion,
  type SuggestionItem,
  Button,
  Field,
  Heading,
  Label,
} from '@digdir/designsystemet-react'
import { Link as ReactRouterLink, useSearchParams } from 'react-router'
import { PlusCircleIcon } from '@navikt/aksel-icons'
import { useAuth } from '../context/AuthContext'
import { RowCountSelect } from '../components/RowCountSelect'

export default function ListStatistics() {
  const [searchParams, setSearchParams] = useSearchParams()
  const shortnamesQuery = searchParams.get('shortname')
  const [count, setCount] = useState(20)
  const [start, setStart] = useState(0)
  const [total, setTotal] = useState(0)
  const [statistics, setStatistics] = useState<StatisticListing[]>([])
  const [shortnames, setShortnames] = useState<ShortnameListing[]>([])
  const [selectedShortnames, setSelectedShortnames] = useState<SuggestionItem[]>([])
  const { auth } = useAuth()

  useEffect(() => {
    fetchStatistics(start, count, selectedShortnames)
  }, [start, count, selectedShortnames])

  const fetchStatistics = async (start: number, count: number, selectedShortnames: SuggestionItem[]) => {
    const filter = {
      ...(selectedShortnames.length && {
        shortname: selectedShortnames.map((item) => item.value).join(','),
      }),
    }
    const { data, error } = await client.GET('/statistics', {
      params: { query: { start, count, ...filter } },
    })
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
    setCount(newCount)
    setStart(0)
  }

  function updateCurrentPage(currentPage: number) {
    setStart((currentPage - 1) * count)
  }

  function filterChanged(selected: SuggestionItem[]) {
    setSelectedShortnames(selected)
    const shortname = selected.map((item) => item.value).join(',')
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (shortname) next.set('shortname', shortname)
        else next.delete('shortname')
        return next
      },
      { replace: true }
    )
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 'var(--ds-size-8)',
          width: '100%',
        }}
      >
        <Field>
          <Label>Filtrer statistikk</Label>
          <Suggestion multiple onSelectedChange={(selected) => filterChanged(selected)} selected={selectedShortnames}>
            <Suggestion.Input />
            <Suggestion.Clear />
            <Suggestion.List>
              <Suggestion.Empty>Ingen treff</Suggestion.Empty>
              {shortnames.map((shortname) => (
                <Suggestion.Option key={shortname.shortname} label={shortname.shortname} value={shortname.shortname}>
                  {shortname.shortname}
                  <div>Kortnavn</div>
                </Suggestion.Option>
              ))}
            </Suggestion.List>
          </Suggestion>
        </Field>
        <div className='row-count-selector'>
          <RowCountSelect selectedRowCount={count} updateRowCount={updateRowCount} />
        </div>
      </div>
      <div>
        <PaginatedStatisticsTable
          start={start}
          count={count}
          total={total}
          statistics={statistics}
          setCurrentPage={updateCurrentPage}
        />
      </div>
    </div>
  )
}
