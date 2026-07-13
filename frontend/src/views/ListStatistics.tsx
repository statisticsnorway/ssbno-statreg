import './ListStatistics.css'
import { useEffect, useState } from 'react'
import client from '../api'
import type { Contact, ShortnameListing, StatisticListing } from '@ssbno-statreg/shared'
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
import { ErrorAlert } from '../components/ErrorAlert'

export default function ListStatistics() {
  const [searchParams, setSearchParams] = useSearchParams()
  const shortnameQuery = searchParams.get('shortname')
  const contactQuery = searchParams.get('contact')
  const sortQuery = searchParams.get('sort')
  const [count, setCount] = useState(20)
  const [start, setStart] = useState(0)
  const [total, setTotal] = useState(0)
  const [statistics, setStatistics] = useState<StatisticListing[]>([])
  const [shortnames, setShortnames] = useState<ShortnameListing[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [apiError, setApiError] = useState<string[]>([])
  const { auth } = useAuth()

  const selectedFilter = shortnameQuery
    ? { label: shortnameQuery, value: `shortname:${shortnameQuery}` }
    : contactQuery
      ? { label: contactQuery, value: `contact:${contactQuery}` }
      : null

  useEffect(() => {
    fetchStatistics(start, count, shortnameQuery, contactQuery, sortQuery)
  }, [start, count, shortnameQuery, contactQuery, sortQuery])

  const fetchStatistics = async (
    start: number,
    count: number,
    shortnameQuery: string | null,
    contactQuery: string | null,
    sortQuery: string | null
  ) => {
    const filter = {
      ...(shortnameQuery && {
        shortname: shortnameQuery,
      }),
      ...(contactQuery && {
        contact: contactQuery,
      }),
    }

    const sort = {
      ...(sortQuery && {
        sort: sortQuery,
      }),
    }

    const { data, error } = await client.GET('/statistics', {
      params: { query: { start, count, ...sort, ...filter } },
    })

    if (error) {
      setApiError((prev) => [...prev, error.error])
      return
    }

    setStatistics(data.statistics ?? [])
    setTotal(data.total ?? 0)
  }

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

  useEffect(() => {
    async function fetchContacts() {
      const { data, error } = await client.GET('/contacts')

      if (error) {
        setApiError((prev) => [...prev, error.error])
        return
      }

      setContacts(data ?? [])
    }
    fetchContacts()
  }, [])

  function updateRowCount(newCount: number) {
    setCount(newCount)
    setStart(0)
  }

  function updateCurrentPage(currentPage: number) {
    setStart((currentPage - 1) * count)
  }

  function onFilterChange(selected: SuggestionItem | null) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('shortname')
      next.delete('contact')

      if (selected) {
        const [category, value] = selected.value.split(':')
        if (category === 'shortname' || category === 'contact') {
          next.set(category, value)
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

  return (
    <div className='list-statistics-container'>
      {apiError.length > 0 && <ErrorAlert message={apiError} />}
      <div className='header-container'>
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
      <div className='suggestion-container'>
        <Field>
          <Label>Filtrer på kortnavn eller kontakt</Label>
          <Suggestion onSelectedChange={(selected) => onFilterChange(selected)} selected={selectedFilter}>
            <Suggestion.Input />
            <Suggestion.Clear onClick={() => onFilterChange(null)} />
            <Suggestion.List className='suggestion-list'>
              <Suggestion.Empty>Ingen treff</Suggestion.Empty>
              {shortnames.map((shortname) => {
                const value = `shortname:${shortname.shortname}`
                return (
                  <Suggestion.Option className='suggestion-item' key={value} label={shortname.shortname} value={value}>
                    {shortname.shortname}
                    <div className='category-label'>Kortnavn</div>
                  </Suggestion.Option>
                )
              })}
              {contacts.map((contact) => {
                const value = `contact:${contact.principalName}`
                return (
                  <Suggestion.Option
                    className='suggestion-item'
                    key={value}
                    label={contact.principalName}
                    value={value}
                  >
                    {contact.name} ({contact.principalName})<div className='category-label'>Kontakt</div>
                  </Suggestion.Option>
                )
              })}
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
          sortBy={sortQuery ?? ''}
          onSortChange={onSortChange}
          statistics={statistics}
          setCurrentPage={updateCurrentPage}
        />
      </div>
    </div>
  )
}
