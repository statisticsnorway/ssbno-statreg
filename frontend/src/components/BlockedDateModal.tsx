import {
  Button,
  Heading,
  Dialog,
  Input,
  Field,
  Label,
  Paragraph,
  Tag,
  Textarea,
  ValidationMessage,
} from '@statisticsnorway/design-react'
import { useDatepicker } from '@navikt/ds-react/DatePicker'
import client from '../api'
import { DatePicker } from './DatePicker'
import { getDateOnlyAsString } from '../lib/utils'
import { useState } from 'react'
import { ErrorAlert } from './ErrorAlert'
import './BlockedDateModal.css'

type BlockedDateProps = {
  openCreateReleaseModal: boolean
  setOpenCreateReleaseModal: React.Dispatch<React.SetStateAction<boolean>>
  onCreated: () => void
}

type BlockedDateErrors = {
  date?: string
  comment?: string
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
  const [errors, setErrors] = useState<BlockedDateErrors>({})

  const { inputProps, selectedDay, setSelected, datepickerProps } = useDatepicker({
    defaultSelected: now,
    onDateChange: () => {
      setApiError([])
      setErrors((e) => ({ ...e, date: '' }))
    },
  })

  function validateFields(): boolean {
    const nextErrors: BlockedDateErrors = {}
    if (!selectedDay) nextErrors.date = 'Velg en gyldig dato'
    if (!comment.trim()) nextErrors.comment = 'Skriv en kommentar'

    setErrors(nextErrors)
    return !Object.values(nextErrors).some(Boolean)
  }

  function submitBlockedDate() {
    if (!validateFields() || !selectedDay) return
    createBlockedDate(selectedDay, comment)
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
        <Paragraph data-size={'sm'} className='labelWithTag'>
          Dato <Tag data-color='warning'>Må fylles ut</Tag>
        </Paragraph>
        <Input id='publishTime' {...inputProps} size={10} className='padded' />
        <DatePicker
          showColorCodingExplanation
          month={datepickerProps.month}
          onMonthChange={datepickerProps.onMonthChange}
          selected={selectedDay}
          onSelect={setSelected}
          apiErrorEmit={setDatePickerError}
        />
        {errors.date && <ValidationMessage>{errors.date}</ValidationMessage>}
        <Field>
          <div className='padded'>
            <Label className='labelWithTag'>
              Kommentar
              <Tag data-color='warning'>Må fylles ut</Tag>
            </Label>
          </div>
          <Field.Description>
            Skriv hvorfor må denne datoen sperres.
            <br />
            F.eks. Helligdag eller planlagt vedlikehold.
          </Field.Description>
          <Textarea
            id='publishComment'
            onChange={(e) => {
              setComment(e.target.value)
              setErrors((err) => ({ ...err, comment: '' }))
            }}
          />
          {errors.comment && <ValidationMessage>{errors.comment}</ValidationMessage>}
          {apiError.length > 0 && <ErrorAlert message={[...apiError, datePickerError]} />}
        </Field>
        <Button variant='primary' onClick={submitBlockedDate} className='padded'>
          Legg til
        </Button>
      </Dialog.Block>
    </Dialog>
  )
}
