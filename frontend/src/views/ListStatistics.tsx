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
  const shortnameQuery = searchParams.get('shortname')
  const [count, setCount] = useState(20)
  const [start, setStart] = useState(0)
  const [total, setTotal] = useState(0)
  const [statistics, setStatistics] = useState<StatisticListing[]>([])
  const [shortnames, setShortnames] = useState<ShortnameListing[]>([])
  const [selectedShortname, setSelectedShortname] = useState<SuggestionItem | null>(null)
  const { auth } = useAuth()

  useEffect(() => {
    fetchStatistics(start, count, selectedShortname)
  }, [start, count, selectedShortname])

  const fetchStatistics = async (start: number, count: number, selectedShortname: SuggestionItem | null) => {
    const filter = {
      ...(selectedShortname && {
        shortname: selectedShortname.value,
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
    async function setSelectedShortnameFromQuery() {
      if (!shortnameQuery) return

      setSelectedShortname({
        label: shortnameQuery,
        value: shortnameQuery,
      })
    }
    setSelectedShortnameFromQuery()
  }, [shortnameQuery])

  function updateRowCount(newCount: number) {
    setCount(newCount)
    setStart(0)
  }

  function updateCurrentPage(currentPage: number) {
    setStart((currentPage - 1) * count)
  }

  function filterChanged(selected: SuggestionItem | null) {
    setSelectedShortname(selected)
    setSearchParams(
      () => {
        const next = new URLSearchParams()
        if (selected) next.set('shortname', selected.value)
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
      <div className='list-statistics-filter-container'>
        <Field>
          <Label>Filtrer statistikk</Label>
          <Suggestion onSelectedChange={(selected) => filterChanged(selected)} selected={selectedShortname}>
            <Suggestion.Input />
            <Suggestion.Clear onClick={() => filterChanged(null)} />
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
        <RowCountSelect selectedRowCount={count} updateRowCount={updateRowCount} />
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
