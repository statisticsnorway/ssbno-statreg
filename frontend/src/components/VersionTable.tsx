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
  { label: 'Endringer', field: 'version.changed_values' },
  { label: 'Kommentar', field: 'version.comment' },
]

function VersionRow({ version }: Readonly<VersionRowProps>) {
  return (
    <Table.Row key={`${version.changed_at}`}>
      <Table.Cell>{formatDateTime(version.changed_at)}</Table.Cell>
      {/* TODO: Get user display name */}
      <Table.Cell>{version.changed_by ?? ''}</Table.Cell>
      {/* TODO: Show changes according to figma */}
      <Table.Cell>
        {version.changed_values
          ?.map((change) => `${change.field_name}: ${change.old_value} -> ${change.new_value}`)
          .join(', ') ?? ''}
      </Table.Cell>
      <Table.Cell>{version.comment ?? ''}</Table.Cell>
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
          <VersionRow key={`${version.changed_at}`} version={version} />
        ))}
      </Table.Body>
    </Table>
  )
}
