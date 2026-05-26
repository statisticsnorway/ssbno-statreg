import { type SetStateAction, type Dispatch } from 'react'
import { Table, Link } from '@digdir/designsystemet-react'

import { type ReleaseListing } from '@ssbno-statreg/shared'
import { ApprovalStatusBadge } from '../components/ApprovalStatus'
import { formatPublishTime, formatDate } from '../lib/utils'
import { Pagination, type PaginationProps } from './Pagination'
import '../views/ListReleases.css'

type TruncatedTableCellProps = {
  value: string | undefined
  maxWidth?: string
}

type ReleaseRowProps = {
  release: ReleaseListing
}

type ReleaseTableProps = {
  releases: ReleaseListing[]
  sortBy?: string[]
  setSortBy?: Dispatch<SetStateAction<string[]>>
}

type PaginatedReleasesTableProps = ReleaseTableProps & PaginationProps

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

function TruncatedTableCell({ value, maxWidth = '340px' }: TruncatedTableCellProps) {
  return (
    <Table.Cell style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth }} title={value}>
      {value}
    </Table.Cell>
  )
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

export function ReleasesTable({ releases, sortBy, setSortBy }: Readonly<ReleaseTableProps>) {
  function toggleSort(field: string) {
    const existingIndex = sortBy?.findIndex((s) => s.replace('-', '') === field) ?? -1
    const newSort = [...(sortBy ?? [])]

    // Example sortBy cycle = ['approval_status'] -> ['approval_status', 'publish_time'] -> ['approval_status', '-publish_time'] -> ['approval_status']
    if (existingIndex === -1) {
      // case 1: if field was not sorted by already, add to the end:
      newSort.push(field)
    } else {
      const isDescending = newSort[existingIndex].startsWith('-')

      if (isDescending) {
        // case 2: if field was sorted in descending order, change to ascending
        newSort.splice(existingIndex, 1)
      } else {
        // case 3: if field was sorted in ascending order, change to descending
        newSort[existingIndex] = `-${field}`
      }
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

export function PaginatedReleasesTable({
  start,
  count,
  total,
  releases,
  sortBy,
  setSortBy,
  setCurrentPage,
}: Readonly<PaginatedReleasesTableProps>) {
  return (
    <div style={{ minWidth: '100%' }}>
      <ReleasesTable releases={releases} sortBy={sortBy} setSortBy={setSortBy} />
      <Pagination start={start} count={count} total={total} setCurrentPage={setCurrentPage} />
    </div>
  )
}
