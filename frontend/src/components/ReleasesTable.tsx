import type { ReactElement } from 'react'
import { Table, Link } from '@digdir/designsystemet-react'

import { type ReleaseListing } from '@ssbno-statreg/shared'
import { ApprovalStatusBadge } from '../components/ApprovalStatus'
import { formatPublishTime, formatDate } from '../lib/utils'
import { ShowRowCountSelect, TablePagination } from './Pagination'
import { usePagination } from '@digdir/designsystemet-react'
import '../views/ListReleases.css'
import { useState, useEffect } from 'react'

type ReleaseTableProps = {
  releases: ReleaseListing[]
  rowSelection?: ReactElement
  pagination?: ReactElement
}

const TABLE_HEADER_CELLS = [
  'Kortnavn',
  'Statistikknavn',
  'Variant',
  'Måleperiodetittel',
  'Målperiode fra',
  'Måleperiode til',
  'Publiseringsdato',
  'Status',
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

export function ReleasesTable({ releases, rowSelection, pagination }: ReleaseTableProps) {
  return (
    <div style={{ minWidth: '100%' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'end',
          marginBottom: 'var(--ds-size-8)',
        }}
      >
        {rowSelection}
      </div>
      <Table>
        <Table.Head>
          <Table.Row>
            {TABLE_HEADER_CELLS.map((header) => (
              <Table.HeaderCell key={header}>{header}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {releases.map((release) => (
            <ReleaseRow key={`${release.publish_time}-${release.id}`} release={release} />
          ))}
        </Table.Body>
      </Table>
      {pagination}
    </div>
  )
}

type PaginatedReleases = {
  releases: ReleaseListing[]
  total: number
}

type FetchReleases = (args: { start: number; count: number }) => Promise<PaginatedReleases>

export function PaginatedReleaseTable({ fetchReleases }: { fetchReleases: FetchReleases }) {
  const [releases, setReleases] = useState<ReleaseListing[]>([])

  const [showRowCount, setShowRowCount] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)

  const { pages, prevButtonProps, nextButtonProps, hasNext, hasPrev } = usePagination({
    currentPage,
    setCurrentPage,
    totalPages: Math.ceil(total / showRowCount),
    showPages: 6,
  })

  useEffect(() => {
    async function loadReleases() {
      const start = (currentPage - 1) * showRowCount
      try {
        const { releases, total } = await fetchReleases({
          start,
          count: showRowCount,
        })
        setReleases(releases)
        setTotal(total)
      } catch (err) {
        console.error(err)
        alert('Failed to fetch releases')
      }
    }
    loadReleases()
  }, [currentPage, showRowCount])

  function handleChangeShowRowCount(e: React.ChangeEvent<HTMLSelectElement>) {
    setShowRowCount(Number(e.target.value))
    setCurrentPage(1)
  }

  return (
    <ReleasesTable
      releases={releases}
      rowSelection={<ShowRowCountSelect showRowCount={showRowCount} onChange={handleChangeShowRowCount} />}
      pagination={
        <TablePagination
          pages={pages}
          prevButtonProps={prevButtonProps}
          nextButtonProps={nextButtonProps}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      }
    />
  )
}
