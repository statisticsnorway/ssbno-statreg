import {
  Button,
  Heading,
  Dialog,
  Input,
  Field,
  Label,
  ValidationMessage,
  Paragraph,
  Tag,
} from '@statisticsnorway/design-react'
import client from '../api'
import { DatePicker } from './DatePicker'
import { getDateOnlyAsString, getFirstDayOfNthMonth } from '../lib/utils'
import { useState } from 'react'
import { ErrorAlert } from './ErrorAlert'

type BlockedDateProps = {
  openCreateReleaseModal: boolean
  setOpenCreateReleaseModal: React.Dispatch<React.SetStateAction<boolean>>
  onCreated: () => void
}

const now = new Date()

export function BlockedDateModal({
  openCreateReleaseModal,
  setOpenCreateReleaseModal,
  onCreated,
}: Readonly<BlockedDateProps>) {
  const [selectedDate, setSelectedDate] = useState(now)
  const [calendarMonth, setCalendarMonth] = useState(getFirstDayOfNthMonth(0))
  const [comment, setComment] = useState('')
  const [apiError, setApiError] = useState<string[]>([])
  const [datePickerError, setDatePickerError] = useState('')

  function selectDate(selected: Date | undefined) {
    if (!selected) return
    setApiError([])
    setSelectedDate(selected)
  }

  async function createBlockedDate(date: Date, message: string) {
    const { error } = await client.POST('/calendar/blocked-release-days/{date}', {
      params: {
        path: {
          date: getDateOnlyAsString(date),
        },
      },
      body: {
        blocked_comment: message,
      },
    })
    if (error) {
      setApiError((prev) => [...prev, error.message])
      return
    }
    onCreated()
    setOpenCreateReleaseModal(false)
  }

  return (
    <Dialog
      // TODO fix ARIA label?!
      aria-labelledby='release-modal-heading'
      open={openCreateReleaseModal}
      onClose={() => setOpenCreateReleaseModal(false)}
    >
      <Dialog.Block>
        <Heading id='release-modal-heading' data-size='xs'>
          Legg til ny sperredato
        </Heading>
      </Dialog.Block>
      <Dialog.Block>
        <Paragraph data-size={'sm'}>
          Dato <Tag data-color='warning'>Må fylles ut</Tag>
        </Paragraph>
        <Input
          id='publishTime'
          value={getDateOnlyAsString(selectedDate)}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          size={10}
          style={{ marginBottom: '0.5rem' }}
        />
        <DatePicker
          fromDate={now}
          toDate={new Date(`31 Dec ${now.getFullYear() + 5}`)}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          selected={selectedDate}
          onSelect={selectDate}
          apiErrorEmit={setDatePickerError}
        />
        <Field>
          <Label>
            Kommentar <Tag data-color='warning'>Må fylles ut</Tag>
          </Label>
          <Field.Description>
            Skriv hvorfor må denne datoen sperres.
            <br />
            F.eks. Helligdag eller planlagt vedlikehold.
          </Field.Description>
          <Input id='publishComment' onChange={(e) => setComment(e.target.value)} size={45} />
          {(apiError || datePickerError) ?? <ErrorAlert message={[...apiError, datePickerError]} />}
        </Field>
        <Button
          variant='primary'
          onClick={() => createBlockedDate(selectedDate, comment)}
          style={{ marginTop: '0.5rem' }}
        >
          Legg til
        </Button>
      </Dialog.Block>
    </Dialog>
  )
}
