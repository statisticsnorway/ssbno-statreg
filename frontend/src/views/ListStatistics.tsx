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
    sortQuery: string
  ) => {
    const filter = {
      ...(shortnameQuery && {
        shortname: shortnameQuery,
      }),
      ...(contactQuery && {
        contact: contactQuery,
      }),
    }
    const { data, error } = await client.GET('/statistics', {
      params: { query: { start, count, sort: sortQuery, ...filter } },
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
    async function fetchContacts() {
      const { data, error } = await client.GET('/contacts')
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setContacts(data ?? [])
      }
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
                const value = `contact:${contact.username}`
                return (
                  <Suggestion.Option className='suggestion-item' key={value} label={contact.username} value={value}>
                    {/* TODO: show "name (username)" when AD caching is done and /contacts endpoint updated MIM-2777 */}
                    {contact.username}
                    <div className='category-label'>Kontakt</div>
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
