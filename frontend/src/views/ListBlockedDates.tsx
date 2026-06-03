import './ListBlockedDates.css'
import { Button, Heading, Link, Paragraph, Table } from '@digdir/designsystemet-react'
import { ArrowLeftIcon, PlusCircleIcon, TrashIcon } from '@navikt/aksel-icons'
import { Link as ReactRouterLink } from 'react-router'
import { type BlockedReleaseDate } from '@ssbno-statreg/shared'

const mockedDays: BlockedReleaseDate[] = [
  { date: '2026-12-24', blocked_comment: 'Julaften', automatically_blocked: false },
  { date: '2026-12-25', blocked_comment: 'Første juledag', automatically_blocked: true },
  { date: '2027-01-01', blocked_comment: 'Første nyttårsdag', automatically_blocked: true },
  { date: '2027-01-02', blocked_comment: 'Kommentar', automatically_blocked: false },
  { date: '2026-05-17', blocked_comment: 'Grunnlovsdagen', automatically_blocked: true },
]

export default function ListBlockedDates() {
  return (
    <>
      <Link asChild>
        <ReactRouterLink to='/'>
          <ArrowLeftIcon /> Tilbake til publiseringsoversikten
        </ReactRouterLink>
      </Link>
      <div>
        <Heading data-size='sm' style={{ marginBottom: 'var(--ds-size-4)' }}>
          Sperrede datoer
        </Heading>
        <Paragraph>Datoer som er automatisk lagt inn kan ikke redigeres eller slettes</Paragraph>
      </div>
      <BlockedDatesTable days={mockedDays} />
      <Button
        variant='tertiary'
        data-color='neutral'
        aria-label='Legg til ny sperret dato'
        onClick={() => alert('Kommer senere')}
      >
        <PlusCircleIcon aria-hidden /> Legg til ny sperret dato
      </Button>
    </>
  )
}

const TABLE_HEADER_CELLS = [{ label: 'Dato' }, { label: 'Kommentar' }, { label: 'Slett' }]

type BlockedDatesTableProps = {
  days: BlockedReleaseDate[]
}

function BlockedDatesTable({ days }: BlockedDatesTableProps) {
  return (
    <Table className='blocked-days-table'>
      <Table.Head>
        <Table.Row>
          {TABLE_HEADER_CELLS.map(({ label }) => (
            <Table.HeaderCell key={label}>{label}</Table.HeaderCell>
          ))}
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {days.map((day) => (
          <BlockedDateRow key={day.date} day={day} />
        ))}
      </Table.Body>
    </Table>
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
        <Button
          style={{ visibility: day.automatically_blocked ? 'hidden' : 'visible' }}
          variant='tertiary'
          data-color='danger'
          className='blocked-days-delete-btn'
          aria-label={`Slett sperret dato: ${day.date}`}
          onClick={() => alert('Kommer senere')}
        >
          <TrashIcon />
        </Button>
      </Table.Cell>
    </Table.Row>
  )
}
