import { useState, useEffect } from 'react'
import { Heading, Paragraph, Table } from '@digdir/designsystemet-react'
import { type ReleaseListing } from '@ssbno-statreg/shared'
import { formatPublishTime, formatDate } from '../lib/utils'
import { ApprovalStatusBadge } from '../components/ApprovalStatus'

import client from '../api'

function ListReleases() {
  const [releases, setReleases] = useState<ReleaseListing[]>([])

  useEffect(() => {
    async function fetchReleases() {
      // TODO: MIM-2660: Default start 0 and count 15 until pagination is implemented; tweak "params"
      const { data, error } = await client.GET('/releases', { params: {} })
      if (error) {
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setReleases(data)
      }
    }
    fetchReleases()
  }, [])

  const TruncatedTableCell = ({ value, maxWidth = '340px' }: { value: string | undefined; maxWidth?: string }) => (
    <Table.Cell style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth }} title={value}>
      {value}
    </Table.Cell>
  )

  // TODO: MIM-2555: Add måleperiodetittel after logic is implemented
  function renderReleaseListTableRows() {
    return Object.entries(releases).map(([__, release]) => (
      <Table.Row key={`${release.publish_time}-${release.id}`}>
        <Table.Cell>{release.statistic?.shortname ?? ''}</Table.Cell>
        <TruncatedTableCell value={release.statistic?.name} />
        <Table.Cell>{release.frequency?.name ?? ''}</Table.Cell>
        <Table.Cell>TBA</Table.Cell>
        <Table.Cell>{formatDate(release.period_from)}</Table.Cell>
        <Table.Cell>{formatDate(release.period_to)}</Table.Cell>
        <Table.Cell>{formatPublishTime(release.publish_time)}</Table.Cell>
        <Table.Cell>
          <ApprovalStatusBadge status={release.approval_status} />
        </Table.Cell>
      </Table.Row>
    ))
  }

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

  function renderReleaseListTableHeaderCells() {
    return tableHeaderCells.map((header) => <Table.HeaderCell key={header}>{header}</Table.HeaderCell>)
  }

  function renderReleaseListingTable() {
    return (
      <div style={{ minWidth: '100%' }}>
        <Table>
          <Table.Head>
            <Table.Row>{renderReleaseListTableHeaderCells()}</Table.Row>
          </Table.Head>
          <Table.Body>{renderReleaseListTableRows()}</Table.Body>
        </Table>
      </div>
    )
  }

  return (
    <>
      <div>
        <Heading level={1}>Publiseringsoversikt</Heading>
        <Paragraph>TBA</Paragraph>
      </div>

      {renderReleaseListingTable()}
    </>
  )
}

export default ListReleases
