import { Heading, Paragraph, Table } from '@digdir/designsystemet-react'

function ReleaseListing() {
  return (
    <>
    <div>
      <Heading level={1}>
        Publiseringsoversikt
      </Heading>
      <Paragraph>TBA</Paragraph>
    </div>

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
        <Table.Row>
          <Table.Cell>kpi</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
    </>
  )
}

export default ReleaseListing