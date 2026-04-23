import { useState, useEffect } from 'react'
import { Heading, Paragraph, Table } from '@digdir/designsystemet-react'
import { type ReleaseListing } from '@ssbno-statreg/shared'

import client from '../api'

function ReleaseListing() {
  const [releases, setReleases] = useState<ReleaseListing>({})

  useEffect(() => {
    async function fetchReleases() {
      const { data, error } = await client.GET('/releases')
      if (error) {
        console.log(error)
        alert(error)
      } else {
        setReleases(data)
      }
    }
    fetchReleases()
  }, [])

  return (
    <>
      <div>
        <Heading level={1}>Publiseringsoversikt</Heading>
        <Paragraph>TBA</Paragraph>
      </div>

      <div>
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>Kortnavn</Table.HeaderCell>
              <Table.HeaderCell>Statistikknavn</Table.HeaderCell>
              <Table.HeaderCell>Variant</Table.HeaderCell>
              <Table.HeaderCell>Måleperiodetittel</Table.HeaderCell>
              <Table.HeaderCell>Målperiode fra</Table.HeaderCell>
              <Table.HeaderCell>Måleperiode til</Table.HeaderCell>
              <Table.HeaderCell>Publiseringsdato</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {Object.entries(releases).map(([key, release]) => (
              <Table.Row key={key}> {/* TODO: Use a proper key */}
                <Table.Cell>{release?.statistic?.shortname}</Table.Cell>
                <Table.Cell>{release?.statistic?.name}</Table.Cell>
                <Table.Cell>-</Table.Cell> {/* TODO: Add variant */}
                <Table.Cell>-</Table.Cell> {/* TODO: Add måleperiodetittel after logic is implemented */}
                <Table.Cell>{release?.period_from}</Table.Cell>
                <Table.Cell>{release?.period_to}</Table.Cell>
                <Table.Cell>{release?.publish_time}</Table.Cell>
                <Table.Cell>{release?.approval_status}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </>
  )
}

export default ReleaseListing
