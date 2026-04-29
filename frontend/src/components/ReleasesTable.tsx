import type { ReactElement } from 'react'
import { Table, Link } from '@digdir/designsystemet-react'

import { type ReleaseListing } from '@ssbno-statreg/shared'
import { ApprovalStatusBadge } from '../components/ApprovalStatus'
import { formatPublishTime, formatDate } from '../lib/utils'

type ReleaseTableProps = {
  releases: ReleaseListing[]
  rowSelection?: ReactElement
  pagination?: ReactElement
}

export function ReleasesTable({ releases, rowSelection, pagination }: ReleaseTableProps) {
  const tableHeaderCells = [
    'Kortnavn',
    'Statistikknavn',
    'Variant',
    'Måleperiodetittel',
    'Målperiode fra',
    'Måleperiode til',
    'Publiseringsdato',
    'Status',
  ]

  function renderListReleasesTableHeaderCells() {
    return tableHeaderCells.map((header) => <Table.HeaderCell key={header}>{header}</Table.HeaderCell>)
  }

  const TruncatedTableCell = ({ value, maxWidth = '340px' }: { value: string | undefined; maxWidth?: string }) => (
    <Table.Cell style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth }} title={value}>
      {value}
    </Table.Cell>
  )

  // TODO: MIM-2555: Add måleperiodetittel after logic is implemented
  function renderListReleasesTableRows() {
    return Object.entries(releases).map(([__, release]) => {
      const statisticsShortname = release.statistic?.shortname ?? ''
      return (
        <Table.Row key={`${release.publish_time}-${release.id}`}>
          <Table.Cell>
            <Link href={`/statistikkregisteret/statistikk/${statisticsShortname}`}>{statisticsShortname}</Link>{' '}
            {/* TODO: Fix /statistikkregisteret urls with react-router; this applies to the /publisering link as well */}
          </Table.Cell>
          <TruncatedTableCell value={release.statistic?.name} />
          <Table.Cell>{release.frequency?.name ?? ''}</Table.Cell>
          <Table.Cell>TBA</Table.Cell>
          <Table.Cell>{formatDate(release.period_from)}</Table.Cell>
          <Table.Cell>{formatDate(release.period_to)}</Table.Cell>
          <Table.Cell>
            <Link href={`/statistikkregisteret/publisering/${release.id}`}>
              {formatPublishTime(release.publish_time)}
            </Link>
          </Table.Cell>
          <Table.Cell>
            <ApprovalStatusBadge status={release.approval_status} />
          </Table.Cell>
        </Table.Row>
      )
    })
  }

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
          <Table.Row>{renderListReleasesTableHeaderCells()}</Table.Row>
        </Table.Head>
        <Table.Body>{renderListReleasesTableRows()}</Table.Body>
      </Table>
      {pagination}
    </div>
  )
}
