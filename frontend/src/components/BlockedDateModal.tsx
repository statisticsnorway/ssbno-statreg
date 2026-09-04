import { Button, Heading, Dialog, Input } from '@statisticsnorway/design-react'
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
    setSelectedDate(selected)
  }

  async function createBlockedDate(date: Date, message: string) {
    const { data, error } = await client.POST('/calendar/blocked-release-days/{date}', {
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
        <DatePicker
          showColorCodingExplanation
          dropdownCaption
          fromDate={now}
          toDate={new Date(`31 Dec ${now.getFullYear() + 5}`)}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          selected={selectedDate}
          onSelect={selectDate}
          apiErrorEmit={setDatePickerError}
        />
        <Heading id='comment-heading' data-size='xs'>
          Kommentar
        </Heading>
        <p>Skriv hvorfor må denne datoen sperres? (F.eks. Helligdag eller planlagt vedlikehold)</p>
        <Input id='publishComment' onChange={(e) => setComment(e.target.value)} size={50} />

        <div style={{ display: 'flex', gap: 'var(--ds-size-4)', marginTop: ' var(--ds-size-4)' }}>
          {(apiError || datePickerError) ?? <ErrorAlert message={[...apiError, datePickerError]} />}
          <Button variant='primary' onClick={() => createBlockedDate(selectedDate, comment)}>
            Legg til
          </Button>
        </div>
      </Dialog.Block>
    </Dialog>
  )
}
