import { Table } from '@digdir/designsystemet-react'

import { type ReleaseListing } from '@ssbno-statreg/shared'
import { ApprovalStatusBadge } from '../components/ApprovalStatus'
import { formatPublishTime, formatDate } from '../lib/utils'
import '../views/ListReleases.css'
type TruncatedTableCellProps = {
  value: string | undefined
  maxWidth?: string
}

type ChangeLogRowProps = {
  release: ReleaseListing
}

type ReleaseTableProps = {
  releases: ReleaseListing[]
  sortBy?: string
  setSortBy?: (sortBy: string) => void
  openInNewTab?: boolean
}

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

function ChangeLogRow({ release }: Readonly<ChangeLogRowProps>) {
  return (
    <Table.Row key={`${release.publish_time}-${release.id}`} className='selectable-row'>
      <TruncatedTableCell value={release.statistic?.name} />
      <Table.Cell>{release.frequency?.name ?? ''}</Table.Cell>
      <Table.Cell>{release.measuring_period_title ?? ''}</Table.Cell>
      <Table.Cell>{formatDate(release.period_from)}</Table.Cell>
      <Table.Cell>{formatDate(release.period_to)}</Table.Cell>
      <Table.Cell>{formatPublishTime(release.publish_time)}</Table.Cell>
      <Table.Cell className='status-column'>
        <ApprovalStatusBadge status={release.approval_status} />
      </Table.Cell>
    </Table.Row>
  )
}

export function ReleasesTable({ releases }: Readonly<ReleaseTableProps>) {
  return (
    <Table>
      <Table.Head>
        <Table.Row>
          {TABLE_HEADER_CELLS.map(({ label }) => (
            <Table.HeaderCell key={label}>{label}</Table.HeaderCell>
          ))}
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {releases?.map((release) => (
          <ChangeLogRow key={`${release.publish_time}-${release.id}`} release={release} />
        ))}
      </Table.Body>
    </Table>
  )
}
