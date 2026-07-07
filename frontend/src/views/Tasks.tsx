import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  Heading,
  Divider,
  Field,
  Label,
  Checkbox,
  Badge,
  Tabs,
  Table,
  EXPERIMENTAL_Suggestion as Suggestion,
  type SuggestionItem,
} from '@digdir/designsystemet-react'

import client from '../api'

import './ListReleases.css'

import { formatPublishTime, formatDate } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { RowCountSelect } from '../components/RowCountSelect'
import { PaginatedReleasesTable, TruncatedTableCell } from '../components/ReleasesTable'
import { ErrorAlert } from '../components/ErrorAlert'
import ErrorPage, { ErrorType } from './ErrorPage'

import { ApprovalStatus, type ReleaseListing, type ShortnameListing } from '@ssbno-statreg/shared'

type PendingReleaseRowProps = {
  pendingRelease: ReleaseListing
}

type PendingReleaseTableProps = {
  pendingReleases: ReleaseListing[]
}

const TABLE_HEADER_CELLS = [
  { label: 'Velg', field: 'choose_release' },
  { label: 'Kortnavn', field: 'statistic.shortname' },
  { label: 'Statistikknavn', field: 'statistic.name' },
  { label: 'Variant', field: 'frequency.name' },
  { label: 'Målperiode fra', field: 'period_from' },
  { label: 'Måleperiode til', field: 'period_to' },
  { label: 'Publiseringsdato', sortable: true, field: 'publish_time' },
]

function ReleaseRow({ pendingRelease }: Readonly<PendingReleaseRowProps>) {
  const statisticsShortname = pendingRelease.statistic?.shortname ?? ''
  return (
    <Table.Row key={`${pendingRelease.publish_time}-${pendingRelease.id}`} className='selectable-row'>
      <Table.Cell>
        <Checkbox label='' description='' value={pendingRelease.id} />
      </Table.Cell>
      <Table.Cell>{statisticsShortname}</Table.Cell>
      <TruncatedTableCell value={pendingRelease.statistic?.name} />
      <Table.Cell>{pendingRelease.frequency?.name ?? ''}</Table.Cell>
      <Table.Cell>{formatDate(pendingRelease.period_from)}</Table.Cell>
      <Table.Cell>{formatDate(pendingRelease.period_to)}</Table.Cell>
      <Table.Cell>{formatPublishTime(pendingRelease.publish_time)}</Table.Cell>
    </Table.Row>
  )
}

function PendingReleasesTable({ pendingReleases }: Readonly<PendingReleaseTableProps>) {
  return (
    <Table>
      <Table.Head>
        <Table.Row>
          {TABLE_HEADER_CELLS.map(({ label }) => (
            <Table.HeaderCell key={label}>{label}</Table.HeaderCell>
          ))}
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {pendingReleases?.map((release) => (
          <ReleaseRow key={`${release.publish_time}-${release.id}`} pendingRelease={release} />
        ))}
      </Table.Body>
    </Table>
  )
}

export default function Tasks() {
  const [searchParams] = useSearchParams()
  const shortnamesQuery = searchParams.get('shortname')
  const [rowCount, setRowCount] = useState(10)
  const [start, setStart] = useState(0)
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [pendingReleases, setPendingReleases] = useState<ReleaseListing[]>([])
  const [total, setTotal] = useState(0)
  const [shortnames, setShortnames] = useState<ShortnameListing[]>([])
  const [apiError, setApiError] = useState<string[]>([])

  const [selectedShortnames, setSelectedShortnames] = useState<SuggestionItem[]>([])
  const [sortBy, setSortBy] = useState<string>('-publish_time')

  const { auth } = useAuth()
  const isAdmin = auth?.isAdmin

  useEffect(() => {
    if (!isAdmin) return
    async function fetchPendingReleases(start: number, count: number, sortBy: string) {
      const sort = sortBy
      const { data, error } = await client.GET('/releases', {
        params: { query: { start, count, approval_status: ApprovalStatus['PENDING'], sort } },
      })

      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        console.log(errorMessage)
        setApiError((prev) => [...prev, errorMessage])
      } else {
        setPendingReleases(data.releases ?? [])
        setTotal(data.total ?? 0)
      }
    }
    fetchPendingReleases(start, rowCount, sortBy)
  }, [isAdmin, start, rowCount, sortBy])

  useEffect(() => {
    if (!isAdmin) return
    async function fetchReleases(start: number, count: number, selectedShortnames: SuggestionItem[], sortBy: string) {
      const filter = {
        ...(selectedShortnames.length && {
          shortname: selectedShortnames.map((item) => item.value).join(','),
        }),
      }

      const sort = sortBy
      const { data, error } = await client.GET('/releases', {
        params: { query: { start, count, ...filter, sort } },
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
    fetchReleases(start, rowCount, selectedShortnames, sortBy)
  }, [isAdmin, start, rowCount, selectedShortnames, sortBy])

  useEffect(() => {
    if (!isAdmin) return
    async function fetchShortnames() {
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

  useEffect(() => {
    async function setSelectedShortnamesFromQuery() {
      if (!isAdmin || !shortnamesQuery) return

      const newSelectedShortnames = shortnamesQuery.split(',').map((shortname) => ({
        label: shortname,
        value: shortname,
      }))
      setSelectedShortnames(newSelectedShortnames)
    }
    setSelectedShortnamesFromQuery()
  }, [isAdmin, shortnamesQuery])

  function updateRowCount(newCount: number) {
    setRowCount(newCount)
    setStart(0)
  }

  function setCurrentPage(currentPage: number) {
    setStart((currentPage - 1) * rowCount)
  }

  function filterChanged(selected: SuggestionItem[]) {
    setSelectedShortnames(selected)
  }

  if (!isAdmin) return <ErrorPage type={ErrorType.NOTAUTH} />

  return (
    <>
      {apiError.length > 0 && <ErrorAlert message={apiError} />}
      <Heading level={2} data-size='sm'>
        Oppgaver
      </Heading>

      <Tabs defaultValue='pending-releases' style={{ width: '100%' }}>
        <Tabs.List>
          <Tabs.Tab value='pending-releases'>
            Publiseringsdatoer <Badge data-color='danger' count={pendingReleases?.length ?? 0} />
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value='pending-releases' style={{ paddingLeft: '0', paddingRight: '0' }}>
          <PendingReleasesTable pendingReleases={pendingReleases} />
        </Tabs.Panel>
      </Tabs>
      <Divider />

      <Heading level={3} data-size='xs'>
        Publiseringsoversikt
      </Heading>
      <div className='list-releases-filter-container'>
        <Field>
          <Label>Søk og filtrer</Label>
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
