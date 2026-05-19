import { Table, Link } from '@digdir/designsystemet-react'

import { type ReleaseListing, type StatisticListing } from '@ssbno-statreg/shared'
import { ApprovalStatusBadge } from '../components/ApprovalStatus'
import { formatPublishTime, formatDate } from '../lib/utils'
import { Pagination } from './Pagination'
import '../views/ListReleases.css'
import { RowCountSelect } from './RowCountSelect'

const TABLE_HEADER_CELLS = ['Kortnavn', 'Statistikknavn', 'Seksjon', 'Status']

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

type StatisticRowProps = {
  statistic: StatisticListing
}

function StatisticRow({ statistic }: StatisticRowProps) {
  const statisticsShortname = statistic.shortname ?? ''
  // const statisticsSection = statistic.contacts?.username ?? ''
  return (
    <Table.Row key={`${statistic.shortname}`}>
      <Table.Cell>
        <Link href={`/statistikkregisteret/statistikk/${statisticsShortname}`}>{statisticsShortname}</Link>
      </Table.Cell>
      <TruncatedTableCell value={statistic.name} />
      <Table.Cell>{'statisticsSection'}</Table.Cell>
      <Table.Cell>
        <ApprovalStatusBadge status={statistic.approval_status} />
      </Table.Cell>
    </Table.Row>
  )
}

export function StatisticsTable({ statistics }: { statistics: StatisticListing[] }) {
  return (
    <Table>
      <Table.Head>
        <Table.Row>
          {TABLE_HEADER_CELLS.map((header) => (
            <Table.HeaderCell key={header}>{header}</Table.HeaderCell>
          ))}
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {statistics?.map((statistic) => (
          <StatisticRow key={${statistic.name}} statistic={${statistic}} />
        ))}
      </Table.Body>
    </Table>
  )
}

type PaginatedStatisticsTableProps = {
  start: number
  count: number
  total: number
  statistics: StatisticListing[]
  updateRowCount: (numberOfRows: number) => void
  setCurrentPage: (selectedPage: number) => void
}

export function PaginatedStatisticsTable({
  start,
  count,
  total,
  statistics,
  updateRowCount,
  setCurrentPage,
}: PaginatedStatisticsTableProps) {
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
      <StatisticsTable statistics={statistics} />
      <Pagination start={start} count={count} total={total} setCurrentPage={setCurrentPage} />
    </div>
  )
}
