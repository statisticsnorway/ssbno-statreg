import { Table } from '@digdir/designsystemet-react'

import { type StatisticListing } from '@ssbno-statreg/shared'
import { ApprovalStatusBadge } from '../components/ApprovalStatus'
import { Pagination } from './Pagination'
import '../views/ListReleases.css'
import { useNavigate } from 'react-router'
import { formatContacts } from '../lib/utils'

const TABLE_HEADER_CELLS = ['Kortnavn', 'Statistikknavn', 'Kontakt', 'Status']

type StatisticRowProps = {
  statistic: StatisticListing
}

function StatisticRow({ statistic }: Readonly<StatisticRowProps>) {
  const statisticsShortname = statistic.shortname ?? ''
  const navigate = useNavigate()
  return (
    <Table.Row
      key={`${statistic.shortname}`}
      className='selectable-row'
      onClick={() => {
        navigate(`/statistikk/${statisticsShortname}`, {})
      }}
    >
      <Table.Cell>{statisticsShortname}</Table.Cell>
      <Table.Cell>{statistic.name}</Table.Cell>
      <Table.Cell>{formatContacts(statistic.contacts).join(', ')}</Table.Cell>
      <Table.Cell className='status-column'>
        <ApprovalStatusBadge status={statistic.approval_status} />
      </Table.Cell>
    </Table.Row>
  )
}

export function StatisticsTable({ statistics }: Readonly<{ statistics: StatisticListing[] }>) {
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
          <StatisticRow key={statistic.name} statistic={statistic} />
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
}

export function PaginatedStatisticsTable({
  start,
  count,
  total,
  statistics,
  setCurrentPage,
}: Readonly<PaginatedStatisticsTableProps>) {
  return (
    <div style={{ minWidth: '100%' }}>
      <StatisticsTable statistics={statistics} />
      <Pagination start={start} count={count} total={total} setCurrentPage={setCurrentPage} />
    </div>
  )
}
