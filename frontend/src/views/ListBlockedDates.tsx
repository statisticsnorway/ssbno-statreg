import { useEffect, useState } from 'react'
import './ListBlockedDates.css'
import { Button, Heading, Link, Paragraph, Table } from '@statisticsnorway/design-react'
import { ArrowLeftIcon, PlusCircleIcon, TrashIcon } from '@navikt/aksel-icons'
import { Link as ReactRouterLink } from 'react-router'
import { type BlockedReleaseDate } from '@ssbno-statreg/shared'
import client from '../api'
import { ErrorAlert } from '../components/ErrorAlert'

type BlockedDateRowProps = {
  readonly day: BlockedReleaseDate
  readonly onDelete: (date: string | undefined) => void
}

type BlockedDatesTableProps = {
  readonly days: readonly BlockedReleaseDate[]
  readonly onDelete: (date: string | undefined) => void
}

function BlockedDateRow({ day, onDelete }: BlockedDateRowProps) {
  return (
    <Table.Row>
      <Table.Cell>{day.date}</Table.Cell>
      <Table.Cell>{day.blocked_comment}</Table.Cell>
      <Table.Cell className='delete-column'>
        {!day.automatically_blocked && (
          <Button
            variant='tertiary'
            data-color='danger'
            aria-label={`Slett sperret dato: ${day.date}`}
            onClick={() => onDelete(day.date)}
          >
            <TrashIcon />
          </Button>
        )}
      </Table.Cell>
    </Table.Row>
  )
}

function BlockedDatesTable({ days, onDelete }: BlockedDatesTableProps) {
  return (
    <Table className='blocked-days-table'>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell key='dato'>Dato</Table.HeaderCell>
          <Table.HeaderCell key='kommentar'>Kommentar</Table.HeaderCell>
          <Table.HeaderCell key='slett' className='delete-column'>
            Slett
          </Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {days.map((day) => (
          <BlockedDateRow key={day.date} day={day} onDelete={onDelete} />
        ))}
      </Table.Body>
    </Table>
  )
}

export default function ListBlockedDates() {
  const [blockedDates, setBlockedDates] = useState<BlockedReleaseDate[]>([])
  const [apiError, setApiError] = useState<string[]>([])

  useEffect(() => {
    async function fetchBlockedDates() {
      const { data, error } = await client.GET('/calendar/blocked-release-days')

      if (error) {
        setApiError((prev) => [...prev, error.message])
        return
      }

      setBlockedDates(data ?? [])
    }
    fetchBlockedDates()
  }, [])

  async function deleteBlockedDate(date: string | undefined) {
    if (!date) return

    const { data, error } = await client.DELETE('/calendar/blocked-release-days/{date}', {
      params: { path: { date } },
    })

    if (error) {
      setApiError((prev) => [...prev, error.message])
      return
    }

    setBlockedDates(data ?? [])
  }

  return (
    <>
      {apiError.length > 0 && <ErrorAlert message={apiError} />}
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
      <BlockedDatesTable days={blockedDates} onDelete={deleteBlockedDate} />
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
