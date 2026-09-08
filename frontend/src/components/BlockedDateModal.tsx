import { Button, Heading, Dialog, Input, Field, Label, Paragraph, Tag, Textarea } from '@statisticsnorway/design-react'
import { useDatepicker } from '@navikt/ds-react/DatePicker'
import client from '../api'
import { DatePicker } from './DatePicker'
import { getDateOnlyAsString } from '../lib/utils'
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
  const [comment, setComment] = useState('')
  const [apiError, setApiError] = useState<string[]>([])
  const [datePickerError, setDatePickerError] = useState('')

  const { inputProps, selectedDay, setSelected, datepickerProps } = useDatepicker({
    defaultSelected: now,
    onDateChange: () => setApiError([]),
  })

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
        <Input id='publishTime' {...inputProps} size={10} style={{ margin: '0.5rem' }} />
        <DatePicker
          showColorCodingExplanation
          month={datepickerProps.month}
          onMonthChange={datepickerProps.onMonthChange}
          selected={selectedDay}
          onSelect={setSelected}
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
          <Textarea id='publishComment' onChange={(e) => setComment(e.target.value)} />
          {(apiError || datePickerError) ?? <ErrorAlert message={[...apiError, datePickerError]} />}
        </Field>
        <Button
          variant='primary'
          onClick={() => selectedDay && createBlockedDate(selectedDay, comment)}
          style={{ marginTop: '0.5rem' }}
        >
          Legg til
        </Button>
      </Dialog.Block>
    </Dialog>
  )
}
