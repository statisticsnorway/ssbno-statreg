import { Button, Heading, Dialog } from '@statisticsnorway/design-react'
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
          'Legg til ny sperredato'
        </Heading>
      </Dialog.Block>
      <Dialog.Block>
        <DatePicker
          month={getFirstDayOfNthMonth(0)}
          selected={selectedDate}
          onSelect={selectDate}
          apiErrorEmit={setDatePickerError}
        />
        <div style={{ display: 'flex', gap: 'var(--ds-size-4)', marginTop: ' var(--ds-size-4)' }}>
          {(apiError || datePickerError) ?? <ErrorAlert message={[...apiError, datePickerError]} />}
          <Button variant='primary' onClick={() => createBlockedDate(selectedDate, 'her lager vi en fin dato')}>
            Legg til
          </Button>
        </div>
      </Dialog.Block>
    </Dialog>
  )
}
