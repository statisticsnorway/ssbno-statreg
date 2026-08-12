import { Table } from '@digdir/designsystemet-react'

import { type Version } from '@ssbno-statreg/shared'
import { formatDateTime } from '../lib/utils'
import '../views/ListReleases.css'

type VersionRowProps = {
  version: Version
}

type VersionTableProps = {
  versions: Version[]
}

const TABLE_HEADER_CELLS = [
  { label: 'Dato', field: 'version.changed_at' },
  { label: 'Bruker', field: 'version.changed_by' },
  { label: 'Endringslogg', field: 'version.changed_values' },
  { label: 'Kommentar', field: 'version.comment' },
]

function VersionRow({ version }: Readonly<VersionRowProps>) {
  let comment = ''
  if (version.comment) {
    comment = version.comment
  } else if (version.change_type === 'create') {
    comment = 'Opprettet'
  } else if (version.change_type === 'delete') {
    comment = 'Slettet'
  }
  return (
    <Table.Row key={`${version.changed_at}-${version.changed_values?.[0]?.field_name ?? ''}`}>
      <Table.Cell>{formatDateTime(version.changed_at)}</Table.Cell>
      <Table.Cell>{version.changed_by ?? ''}</Table.Cell>
      <Table.Cell>
        {version.changed_values?.map((change, index) => (
          <span key={`${version.changed_at}-${change.field_name}`}>
            {index > 0 ? <br /> : ''}
            {change.field_name}: <span style={{ color: 'red' }}>{change.old_value}</span> / {change.new_value}
          </span>
        )) ?? ''}
      </Table.Cell>
      <Table.Cell>{comment}</Table.Cell>
    </Table.Row>
  )
}

export function ChangeLogTable({ versions }: Readonly<VersionTableProps>) {
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
        {versions?.map((version) => (
          <VersionRow
            key={`${version.changed_at}-${version.changed_values?.[0]?.field_name ?? ''}`}
            version={version}
          />
        ))}
      </Table.Body>
    </Table>
  )
}
