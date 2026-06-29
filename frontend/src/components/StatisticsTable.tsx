import { Table } from '@digdir/designsystemet-react'

import { type StatisticListing } from '@ssbno-statreg/shared'
import { ApprovalStatusBadge } from '../components/ApprovalStatus'
import { Pagination } from './Pagination'
import '../views/ListReleases.css'
import { Link } from 'react-router'
import { formatContacts, getSortDirection, toggleSort } from '../lib/utils'

const TABLE_HEADER_CELLS = [
  { label: 'Kortnavn', field: 'shortname', sortable: true },
  { label: 'Statistikknavn', field: 'statistic.name' },
  { label: 'Kontakt', field: 'statistic.contact' },
  { label: 'Status', field: 'statistic.status' },
]

type StatisticRowProps = {
  statistic: StatisticListing
  openInNewTab?: boolean
}

function StatisticRow({ statistic, openInNewTab }: Readonly<StatisticRowProps>) {
  const statisticsShortname = statistic.shortname ?? ''
  return (
    <Table.Row key={`${statistic.shortname}`} className='selectable-row'>
      <Table.Cell>
        <Link
          className='row-link'
          to={`/statistikk/${statisticsShortname}`}
          target={openInNewTab ? '_blank' : undefined}
          rel={openInNewTab ? 'noopener noreferrer' : undefined}
        >
          {statisticsShortname}
        </Link>
      </Table.Cell>
      <Table.Cell>{statistic.name}</Table.Cell>
      <Table.Cell>{formatContacts(statistic.contacts).join(', ')}</Table.Cell>
      <Table.Cell className='status-column'>
        <ApprovalStatusBadge status={statistic.approval_status} />
      </Table.Cell>
    </Table.Row>
  )
}

export function StatisticsTable({
  statistics,
  openInNewTab,
  sortBy,
  onSortChange,
}: Readonly<{
  statistics: StatisticListing[]
  openInNewTab?: boolean
  sortBy?: string
  onSortChange?: (sortBy: string) => void
}>) {
  return (
    <Table>
      <Table.Head>
        <Table.Row>
          {TABLE_HEADER_CELLS.map(({ label, field, sortable }) => (
            <Table.HeaderCell
              key={field}
              onClick={sortable && onSortChange ? () => onSortChange(toggleSort(field, sortBy || '')) : undefined}
              sort={sortable ? getSortDirection(field, sortBy || '') : undefined}
            >
              {label}
            </Table.HeaderCell>
          ))}
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {statistics?.map((statistic) => (
          <StatisticRow key={statistic.name} statistic={statistic} openInNewTab={openInNewTab} />
        ))}
      </Table.Body>
    </Table>
  )
}

type PaginatedStatisticsTableProps = {
  start: number
  count: number
  total: number
  sortBy: string
  onSortChange?: (sortBy: string) => void
  statistics: StatisticListing[]
  setCurrentPage: (selectedPage: number) => void
  openInNewTab?: boolean
}

export function PaginatedStatisticsTable({
  start,
  count,
  total,
  sortBy,
  onSortChange,
  statistics,
  setCurrentPage,
  openInNewTab,
}: Readonly<PaginatedStatisticsTableProps>) {
  return (
    <div style={{ minWidth: '100%' }}>
      <StatisticsTable
        statistics={statistics}
        openInNewTab={openInNewTab}
        sortBy={sortBy}
        onSortChange={onSortChange}
      />
      <Pagination start={start} count={count} total={total} setCurrentPage={setCurrentPage} />
    </div>
  )
}
