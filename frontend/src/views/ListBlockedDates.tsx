import { Button, Heading, Link, Paragraph, Table } from '@digdir/designsystemet-react'
import { ArrowLeftIcon, TrashIcon } from '@navikt/aksel-icons'
import { Link as ReactRouterLink } from 'react-router'
import { type BlockedReleaseDate } from '@ssbno-statreg/shared'

const TABLE_HEADER_CELLS = [{ label: 'Dato' }, { label: 'Kommentar' }, { label: 'Slett' }]

const mockedDays: BlockedReleaseDate[] = [
  { date: '2026-12-24', blocked_comment: 'Christmas eve' },
  { date: '2026-12-25', blocked_comment: 'Christmas day' },
  { date: '2026-01-01', blocked_comment: 'New year' },
]

export default function ListBlockedDates() {
  return (
    <>
      <Link asChild>
        <ReactRouterLink to='/publisering'>
          <ArrowLeftIcon /> Tilbake til publiseringsoversikten
        </ReactRouterLink>
      </Link>
      <div>
        <Heading data-size='sm' style={{ marginBottom: 'var(--ds-size-4)' }}>
          Sperrede datoer
        </Heading>
        <Paragraph>Datoer som er automatisk lagt inn kan ikke redigeres eller slettes</Paragraph>
      </div>
      <Table>
        <Table.Head>
          <Table.Row>
            {TABLE_HEADER_CELLS.map(({ label }) => (
              <Table.HeaderCell key={label}>{label}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {mockedDays.map((day) => (
            <BlockedDateRow key={day.date} day={day} />
          ))}
        </Table.Body>
      </Table>
    </>
  )
}

type BlockedDateRowProps = {
  day: BlockedReleaseDate
}

function BlockedDateRow({ day }: BlockedDateRowProps) {
  return (
    <Table.Row>
      <Table.Cell>{day.date}</Table.Cell>
      <Table.Cell>{day.blocked_comment}</Table.Cell>
      <Table.Cell>
        <Button variant='tertiary' data-color='danger'>
          <TrashIcon />
        </Button>
      </Table.Cell>
    </Table.Row>
  )
}
