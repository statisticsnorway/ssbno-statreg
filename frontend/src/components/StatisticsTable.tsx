import { Table } from '@statisticsnorway/design-react'

import { type StatisticListing } from '@ssbno-statreg/shared'
import { ApprovalStatusBadge } from '../components/ApprovalStatus'
import { Pagination } from './Pagination'
import '../views/ListReleases.css'
import { Link } from 'react-router'
import { formatContacts } from '../lib/utils'

const TABLE_HEADER_CELLS = ['Kortnavn', 'Statistikknavn', 'Kontakt', 'Status']

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
}: Readonly<{ statistics: StatisticListing[]; openInNewTab?: boolean }>) {
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
  statistics: StatisticListing[]
  setCurrentPage: (selectedPage: number) => void
  openInNewTab?: boolean
}

export function PaginatedStatisticsTable({
  start,
  count,
  total,
  statistics,
  setCurrentPage,
  openInNewTab,
}: Readonly<PaginatedStatisticsTableProps>) {
  return (
    <div style={{ minWidth: '100%' }}>
      <StatisticsTable statistics={statistics} openInNewTab={openInNewTab} />
      <Pagination start={start} count={count} total={total} setCurrentPage={setCurrentPage} />
    </div>
  )
}
