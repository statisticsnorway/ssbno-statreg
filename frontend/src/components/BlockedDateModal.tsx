import {
  Button,
  Heading,
  Dialog,
  Input,
  Field,
  Label,
  Tag,
  Textarea,
  ValidationMessage,
  Alert,
} from '@statisticsnorway/design-react'
import { useDatepicker } from '@navikt/ds-react/DatePicker'
import client from '../api'
import { DatePicker } from './DatePicker'
import { getDateOnlyAsString } from '../lib/utils'
import { useState } from 'react'
import { ErrorAlert } from './ErrorAlert'
import './BlockedDateModal.css'
import type { CalenderDate } from '@ssbno-statreg/shared'

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
  const [calendarDates, setCalendarDates] = useState<CalenderDate>({})

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

  function submitBlockedDate(e: React.ChangeEvent<HTMLFormElement>) {
    e.preventDefault()
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
      aria-labelledby='release-modal-heading'
      open={openCreateReleaseModal}
      onClose={() => setOpenCreateReleaseModal(false)}
    >
      <Dialog.Block>
        <Heading id='release-modal-heading' level={2}>
          Legg til ny sperredato
        </Heading>
      </Dialog.Block>
      <Dialog.Block>
        <form onSubmit={submitBlockedDate}>
          <Field>
            <Label data-size='md' className='labelWithTag'>
              Dato <Tag data-color='warning'>Må fylles ut</Tag>
            </Label>
            <div>
              <Field.Description>dd.mm.åååå</Field.Description>
            </div>
            <Input id='publishTime' {...inputProps} size={10} className='padded' />
            {errors.date && <ValidationMessage>{errors.date}</ValidationMessage>}
            {calendarDates[getDateOnlyAsString(selectedDay)]?.status.match('FULL|MANY|FEW') && (
              <Alert data-color='warning' className='padded'>
                Denne datoen har meldte publiseringer. Du kan fortsatt sperre datoen.
              </Alert>
            )}
            {calendarDates[getDateOnlyAsString(selectedDay)]?.status == 'BLOCKED' && (
              <Alert data-color='danger' className='padded'>
                Denne datoen er allerede sperret.
              </Alert>
            )}
          </Field>
          <DatePicker
            showColorCodingExplanation
            month={datepickerProps.month}
            onMonthChange={datepickerProps.onMonthChange}
            selected={selectedDay}
            onSelect={setSelected}
            apiErrorEmit={setDatePickerError}
            calendarDatesEmit={setCalendarDates}
          />
          <Field>
            <div className='padded'>
              <Label data-size='md' className='labelWithTag'>
                Kommentar
                <Tag data-color='warning'>Må fylles ut</Tag>
              </Label>
            </div>
            <Field.Description>
              Skriv hvorfor må denne datoen sperres. F.eks. Helligdag eller planlagt vedlikehold.
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
          <Button type='submit' variant='primary' className='padded'>
            Legg til
          </Button>
        </form>
      </Dialog.Block>
    </Dialog>
  )
}
