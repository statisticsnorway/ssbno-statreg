import { Table } from '@statisticsnorway/design-react'

import { type ReleaseListing } from '@ssbno-statreg/shared'
import { ApprovalStatusBadge } from '../components/ApprovalStatus'
import { formatDateTime, formatDate, toggleSort, getSortDirection } from '../lib/utils'
import { Pagination, type PaginationProps } from './Pagination'
import '../views/ListReleases.css'
import { Link } from 'react-router'

type TruncatedTableCellProps = {
  value: string | undefined
  maxWidth?: string
}

type ReleaseRowProps = {
  release: ReleaseListing
  openInNewTab?: boolean
}

type ReleaseTableProps = {
  releases: ReleaseListing[]
  sortBy?: string
  setSortBy?: (sortBy: string) => void
  openInNewTab?: boolean
}

type PaginatedReleasesTableProps = ReleaseTableProps & PaginationProps

const TABLE_HEADER_CELLS = [
  { label: 'Kortnavn', field: 'statistic.shortname' },
  { label: 'Statistikknavn', field: 'statistic.name' },
  { label: 'Variant', field: 'frequency.name' },
  { label: 'Måleperiodetittel', field: 'measuring_period_title' },
  { label: 'Målperiode fra', field: 'period_from' },
  { label: 'Måleperiode til', field: 'period_to' },
  { label: 'Publiseringsdato', sortable: true, field: 'publish_time' },
  { label: 'Status', field: 'approval_status' },
]

export function TruncatedTableCell({ value, maxWidth = '340px' }: TruncatedTableCellProps) {
  return (
    <Table.Cell style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth }} title={value}>
      {value}
    </Table.Cell>
  )
}

function ReleaseRow({ release, openInNewTab }: Readonly<ReleaseRowProps>) {
  const statisticsShortname = release.statistic?.shortname ?? ''
  return (
    <Table.Row key={`${release.publish_time}-${release.id}`} className='selectable-row'>
      <Table.Cell>
        <Link
          className='row-link'
          to={`/publisering/${release.id}`}
          target={openInNewTab ? '_blank' : undefined}
          rel={openInNewTab ? 'noopener noreferrer' : undefined}
        >
          {statisticsShortname}
        </Link>
      </Table.Cell>
      <TruncatedTableCell value={release.statistic?.name} />
      <Table.Cell>{release.frequency?.name ?? ''}</Table.Cell>
      <Table.Cell>{release.measuring_period_title ?? ''}</Table.Cell>
      <Table.Cell>{formatDate(release.period_from)}</Table.Cell>
      <Table.Cell>{formatDate(release.period_to)}</Table.Cell>
      <Table.Cell>{formatDateTime(release.publish_time)}</Table.Cell>
      <Table.Cell className='status-column'>
        <ApprovalStatusBadge status={release.approval_status} />
      </Table.Cell>
    </Table.Row>
  )
}

export function ReleasesTable({ releases, sortBy, setSortBy, openInNewTab }: Readonly<ReleaseTableProps>) {
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
        {releases?.map((release) => (
          <ReleaseRow key={`${release.publish_time}-${release.id}`} release={release} openInNewTab={openInNewTab} />
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
  openInNewTab,
}: Readonly<PaginatedReleasesTableProps>) {
  return (
    <div style={{ minWidth: '100%' }}>
      <ReleasesTable releases={releases} sortBy={sortBy} setSortBy={setSortBy} openInNewTab={openInNewTab} />
      <Pagination start={start} count={count} total={total} setCurrentPage={setCurrentPage} />
    </div>
  )
}
