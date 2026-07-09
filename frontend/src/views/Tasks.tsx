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
  useCheckboxGroup,
  Button,
  Alert,
} from '@digdir/designsystemet-react'
import { EraserIcon } from '@navikt/aksel-icons'

import client from '../api'

import './Tasks.css'

import { formatPublishTime, formatDate, toggleSort, getSortDirection } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { RowCountSelect } from '../components/RowCountSelect'
import { Pagination } from '../components/Pagination'
import { PaginatedReleasesTable, TruncatedTableCell } from '../components/ReleasesTable'
import { ErrorAlert } from '../components/ErrorAlert'
import ErrorPage, { ErrorType } from './ErrorPage'

import { ApprovalStatus, type ReleaseListing, type ShortnameListing } from '@ssbno-statreg/shared'

type PendingReleaseRowProps = {
  pendingRelease: ReleaseListing
  getCheckboxProps: ReturnType<typeof useCheckboxGroup>['getCheckboxProps']
}

type PendingReleaseTableProps = {
  pendingReleases: ReleaseListing[]
  getCheckboxProps: ReturnType<typeof useCheckboxGroup>['getCheckboxProps']
  sortBy?: string
  setSortBy?: (sortBy: string) => void
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

function PendingReleaseRow({ pendingRelease, getCheckboxProps }: Readonly<PendingReleaseRowProps>) {
  const statisticsShortname = pendingRelease.statistic?.shortname ?? ''
  return (
    <Table.Row key={`${pendingRelease.publish_time}-${pendingRelease.id}`} className='selectable-row'>
      <Table.Cell>
        <Checkbox aria-label='choose_releases' {...getCheckboxProps(pendingRelease.id?.toString())} />
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

function PendingReleasesTable({
  pendingReleases,
  getCheckboxProps,
  sortBy,
  setSortBy,
}: Readonly<PendingReleaseTableProps>) {
  return (
    <Table>
      <Table.Head>
        <Table.Row>
          {TABLE_HEADER_CELLS.map(({ label, field, sortable }) => (
            <Table.HeaderCell
              key={label}
              onClick={sortable && setSortBy ? () => setSortBy(toggleSort(field, sortBy || '')) : undefined}
              sort={sortable ? getSortDirection(field, sortBy || '') : undefined}
            >
              {label}
            </Table.HeaderCell>
          ))}
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {pendingReleases?.map((release) => (
          <PendingReleaseRow
            key={`${release.publish_time}-${release.id}`}
            pendingRelease={release}
            getCheckboxProps={getCheckboxProps}
          />
        ))}
      </Table.Body>
    </Table>
  )
}

export default function Tasks() {
  const [pendingRowCount, setPendingRowCount] = useState(10)
  const [pendingStart, setPendingStart] = useState(0)
  const [pendingReleases, setPendingReleases] = useState<ReleaseListing[]>([])
  const [pendingTotal, setPendingTotal] = useState(0)
  const [pendingSortBy, setPendingSortBy] = useState<string>('-publish_time')
  const [approvedReleasesCount, setApprovedReleasesCount] = useState(0)

  const [searchParams] = useSearchParams()
  const shortnamesQuery = searchParams.get('shortname')
  const [rowCount, setRowCount] = useState(10)
  const [start, setStart] = useState(0)
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [total, setTotal] = useState(0)
  const [shortnames, setShortnames] = useState<ShortnameListing[]>([])
  const [sortBy, setSortBy] = useState<string>('-publish_time')
  const [apiError, setApiError] = useState<string[]>([])
  const [selectedShortnames, setSelectedShortnames] = useState<SuggestionItem[]>([])

  const { auth } = useAuth()
  const isAdmin = auth?.isAdmin

  const {
    value: selectedPendingReleaseIds,
    setValue: setSelectedPendingReleaseIds,
    getCheckboxProps,
  } = useCheckboxGroup({
    name: 'pending-releases-table',
    value: [],
  })

  useEffect(() => {
    if (!isAdmin) return
    async function fetchPendingReleases(start: number, count: number, sortBy: string) {
      const { data, error } = await client.GET('/releases', {
        params: { query: { start, count, approval_status: ApprovalStatus.PENDING, sort: sortBy } },
      })

      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        setApiError((prev) => [...prev, errorMessage])
        return
      }

      setPendingReleases(data.releases ?? [])
      setPendingTotal(data.total ?? 0)
    }
    fetchPendingReleases(pendingStart, pendingRowCount, pendingSortBy)
  }, [isAdmin, pendingStart, pendingRowCount, pendingSortBy, approvedReleasesCount])

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

  async function batchApproveReleases() {
    const { data, error } = await client.POST('/releases/bulk-approve', {
      body: { ids: selectedPendingReleaseIds.map(Number) },
    })

    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (error as any).error
      console.log(errorMessage)
      setApiError((prev) => [...prev, errorMessage])
    } else {
      setApprovedReleasesCount(data.releases?.filter(({ status }) => status === 200)?.length ?? 0)
      setSelectedPendingReleaseIds([])
      setPendingStart(0)
    }
  }

  function handleOnSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!selectedPendingReleaseIds.length) return

    batchApproveReleases()
  }

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

  function updatePendingRowCount(newCount: number) {
    setPendingRowCount(newCount)
    setPendingStart(0)
  }

  function setCurrentPendingPage(currentPage: number) {
    setPendingStart((currentPage - 1) * pendingRowCount)
  }

  if (!isAdmin) return <ErrorPage type={ErrorType.NOTAUTH} />

  const publishedReleasesAmountText =
    approvedReleasesCount === 1 ? `${approvedReleasesCount} publisering` : `${approvedReleasesCount} publiseringer`
  return (
    <>
      {apiError.length > 0 && <ErrorAlert message={apiError} />}
      <Heading level={2} data-size='md'>
        Oppgaver
      </Heading>

      <Tabs defaultValue='pending-releases' className='pending-releases-tab'>
        <Tabs.List>
          <Tabs.Tab value='pending-releases'>
            Publiseringsdatoer <Badge data-color='danger' count={pendingTotal} />
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value='pending-releases' className='pending-releases-tab-panel'>
          <form onSubmit={handleOnSubmit}>
            <div
              className='row-count-select-wrapper'
              style={{ justifyContent: approvedReleasesCount > 0 ? 'space-between' : 'flex-end' }}
            >
              {approvedReleasesCount > 0 && (
                <Alert data-color='success'>{`${publishedReleasesAmountText} har blitt godkjent`}</Alert>
              )}
              <RowCountSelect selectedRowCount={pendingRowCount} updateRowCount={updatePendingRowCount} />
            </div>
            <PendingReleasesTable
              pendingReleases={pendingReleases}
              getCheckboxProps={getCheckboxProps}
              sortBy={pendingSortBy}
              setSortBy={setPendingSortBy}
            />
            {selectedPendingReleaseIds.length > 0 && (
              <div className='pending-releases-buttons-wrapper'>
                <Button variant='primary' type='submit'>
                  Godkjenn ({selectedPendingReleaseIds.length} valgte)
                </Button>
                <Button variant='tertiary' onClick={() => setSelectedPendingReleaseIds([])}>
                  <EraserIcon />
                  Nullstill valg
                </Button>
              </div>
            )}
            <Pagination
              start={pendingStart}
              count={pendingRowCount}
              total={pendingTotal}
              setCurrentPage={setCurrentPendingPage}
            />
          </form>
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
