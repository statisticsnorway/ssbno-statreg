import { type SetStateAction, type Dispatch } from 'react'
import { Table, Link } from '@digdir/designsystemet-react'

import { type ReleaseListing } from '@ssbno-statreg/shared'
import { ApprovalStatusBadge } from '../components/ApprovalStatus'
import { formatPublishTime, formatDate } from '../lib/utils'
import { Pagination } from './Pagination'
import '../views/ListReleases.css'
import { RowCountSelect } from './RowCountSelect'

const TABLE_HEADER_CELLS = [
  { label: 'Kortnavn', field: 'statistic.shortname' },
  { label: 'Statistikknavn', field: 'statistic.name' },
  { label: 'Variant', field: 'frequency.name' },
  { label: 'Måleperiodetittel' },
  { label: 'Målperiode fra', field: 'period_from' },
  { label: 'Måleperiode til', field: 'period_to' },
  { label: 'Publiseringsdato', sortable: true, field: 'publish_time' },
  { label: 'Status', field: 'approval_status' },
]

type TruncatedTableCellProps = {
  value: string | undefined
  maxWidth?: string
}

function TruncatedTableCell({ value, maxWidth = '340px' }: TruncatedTableCellProps) {
  return (
    <Table.Cell style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth }} title={value}>
      {value}
    </Table.Cell>
  )
}

type ReleaseRowProps = {
  release: ReleaseListing
}

function ReleaseRow({ release }: ReleaseRowProps) {
  const statisticsShortname = release.statistic?.shortname ?? ''
  return (
    <Table.Row key={`${release.publish_time}-${release.id}`}>
      <Table.Cell>
        <Link href={`/statistikkregisteret/statistikk/${statisticsShortname}`}>{statisticsShortname}</Link>
      </Table.Cell>
      <TruncatedTableCell value={release.statistic?.name} />
      <Table.Cell>{release.frequency?.name ?? ''}</Table.Cell>
      <Table.Cell>TBA</Table.Cell>
      <Table.Cell>{formatDate(release.period_from)}</Table.Cell>
      <Table.Cell>{formatDate(release.period_to)}</Table.Cell>
      <Table.Cell>
        <Link href={`/statistikkregisteret/publisering/${release.id}`}>{formatPublishTime(release.publish_time)}</Link>
      </Table.Cell>
      <Table.Cell>
        <ApprovalStatusBadge status={release.approval_status} />
      </Table.Cell>
    </Table.Row>
  )
}

export function ReleasesTable({
  releases,
  sortBy,
  setSortBy,
}: {
  releases: ReleaseListing[]
  sortBy?: string[]
  setSortBy?: Dispatch<SetStateAction<string[]>>
}) {
  function toggleSort(field: string) {
    const existingIndex = sortBy?.findIndex((s) => s.replace('-', '') === field) ?? -1

    const newSort = [...(sortBy ?? [])]

    if (existingIndex === -1) {
      newSort.push(field)
    } else if (!newSort[existingIndex].startsWith('-')) {
      newSort[existingIndex] = `-${field}`
    } else {
      newSort.splice(existingIndex, 1)
    }

    setSortBy?.(newSort?.length ? newSort : [])
  }

  function getSortDirection(field: string) {
    if (sortBy?.length === 0) return 'none'

    const entry = sortBy?.find((s) => s.replace('-', '') === field)

    if (!entry) return undefined
    return entry.startsWith('-') ? 'descending' : 'ascending'
  }

  return (
    <Table>
      <Table.Head>
        <Table.Row>
          {TABLE_HEADER_CELLS.map(({ label, field, sortable }) => (
            <Table.HeaderCell
              key={label}
              onClick={sortable ? () => toggleSort(field) : undefined}
              sort={sortable ? getSortDirection(field) : undefined}
            >
              {label}
            </Table.HeaderCell>
          ))}
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {releases?.map((release) => (
          <ReleaseRow key={`${release.publish_time}-${release.id}`} release={release} />
        ))}
      </Table.Body>
    </Table>
  )
}

type PaginatedReleasesTableProps = {
  start: number
  count: number
  total: number
  releases: ReleaseListing[]
  sortBy?: string[]
  setSortBy: Dispatch<SetStateAction<string[]>>
  updateRowCount: (numberOfRows: number) => void
  setCurrentPage: (selectedPage: number) => void
}

export function PaginatedReleasesTable({
  start,
  count,
  total,
  releases,
  sortBy,
  setSortBy,
  updateRowCount,
  setCurrentPage,
}: PaginatedReleasesTableProps) {
  return (
    <div style={{ minWidth: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'end',
          marginBottom: 'var(--ds-size-8)',
        }}
      >
        <RowCountSelect selectedRowCount={count} updateRowCount={updateRowCount} />
      </div>
      <ReleasesTable releases={releases} sortBy={sortBy} setSortBy={setSortBy} />
      <Pagination start={start} count={count} total={total} setCurrentPage={setCurrentPage} />
    </div>
  )
}
