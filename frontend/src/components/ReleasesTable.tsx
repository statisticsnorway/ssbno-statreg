import { Table, Link } from '@digdir/designsystemet-react'

import { type ReleaseListing } from '@ssbno-statreg/shared'
import { ApprovalStatusBadge } from '../components/ApprovalStatus'
import { formatPublishTime, formatDate } from '../lib/utils'
import { ShowRowCountSelect, Pagination, useTablePagination, type FetchTableData } from './Pagination'
import '../views/ListReleases.css'

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

export function ReleasesTable({ releases }: { releases: ReleaseListing[] }) {
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
        {releases?.map((release) => (
          <ReleaseRow key={`${release.publish_time}-${release.id}`} release={release} />
        ))}
      </Table.Body>
    </Table>
  )
}

export function PaginatedReleasesTable({ fetchReleases }: { fetchReleases: FetchTableData }) {
  const {
    tableData: paginatedReleases,
    handleChangeShowRowCount,
    showRowCount,
    pages,
    prevButtonProps,
    nextButtonProps,
    hasNext,
    hasPrev,
  } = useTablePagination({ fetchTableData: fetchReleases })

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
        <ShowRowCountSelect showRowCount={showRowCount} onChange={handleChangeShowRowCount} />
      </div>
      <ReleasesTable releases={paginatedReleases} />
      <Pagination
        pages={pages}
        prevButtonProps={prevButtonProps}
        nextButtonProps={nextButtonProps}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />
    </div>
  )
}
