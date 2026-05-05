import { useState } from 'react'
import {
  Paragraph,
  Select,
  Button,
  Fieldset,
  Field,
  Label,
  Input,
  ValidationMessage,
  ErrorSummary,
} from '@digdir/designsystemet-react'
import { DatePicker as AkselDatePicker, useDatepicker } from '@navikt/ds-react/DatePicker'
import { DatePicker } from './DatePicker'
import { getFirstDayOfNthMonth, getLastDayOfNthMonth } from '../lib/utils'

const releaseDatePrecisions = ['Dag', 'Måned', 'År']

type ReleaseFormErrors = {
  dateType?: string
  publishDate?: string
  periodFrom?: string
  periodTo?: string
}

export function ReleaseForm() {
  const [dateType, setDateType] = useState('')
  const [publishTime, setPublishTime] = useState('')
  const [periodFrom, setPeriodFrom] = useState('')
  const [periodTo, setPeriodTo] = useState('')
  const [errors, setErrors] = useState<ReleaseFormErrors>({})

  const { datepickerProps: publishTimePickerProps, inputProps: publishTimeInputProps } = useDatepicker({
    onDateChange: (date) => {
      if (date) setPublishTime(date)
    }
  })
  const { datepickerProps: periodFromPickerProps, inputProps: periodFromInputProps } = useDatepicker({
    onDateChange: (date) => {
      if (date) setPeriodTo(date)
    }
  })
  const { datepickerProps: periodToPickerProps, inputProps: periodToInputProps } = useDatepicker({
    onDateChange: (date) => {
      if (date) setPeriodFrom(date)
    }
  })

  const start = getFirstDayOfNthMonth(0)
  const stop = getLastDayOfNthMonth(0)

  function validateFields() {
    const nextErrors: ReleaseFormErrors = {}

    if (!dateType) nextErrors.dateType = 'Velg en datotype for publisering'
    if (!publishTime) nextErrors.publishDate = 'Velg en publiseringsdato'
    if (!periodFrom) nextErrors.periodFrom = 'Velg en fra-dato'
    if (!periodTo) nextErrors.periodTo = 'Velg en til-dato'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validateFields()) return

    console.log('Form OK')
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field>
        <Paragraph style={{ marginBottom: 'var(--ds-size-8)' }}>Alle felter må fylles ut</Paragraph>
        <Label>Datotype for publisering</Label>
        <Select value={dateType} onChange={(e) => setDateType(e.target.value)} aria-invalid={!!errors.dateType}>
          <Select.Option value='' disabled>
            Velg datotype
          </Select.Option>
          {releaseDatePrecisions.map((precision) => (
            <Select.Option value={precision}>{precision}</Select.Option>
          ))}
        </Select>
        <ValidationMessage>{errors.dateType}</ValidationMessage>
      </Field>

      <Field>
        <Label>Publiseringsdato</Label>
        <Field.Description>
          Nye datoer og endringer må meldes minst 3 måneder i forveien. <br />
          For kortere frister, kontakt desken@ssb.no.
        </Field.Description>
        <Input size={10} {...publishTimeInputProps} aria-invalid={!!errors.publishDate} />
        <DatePicker fromDate={start} toDate={stop} showColorCodingExplanation {...publishTimePickerProps} />
        <ValidationMessage>{errors.publishDate}</ValidationMessage>
      </Field>

      <Fieldset>
        <div style={{ display: 'flex', gap: 'var(--ds-size-12)' }}>
          <Field>
            <Label>Måleperiode fra</Label>
            <AkselDatePicker {...periodFromPickerProps}>
              <AkselDatePicker.Input
                {...periodFromInputProps}
                aria-invalid={!!errors.periodFrom}
                label
              />
            </AkselDatePicker>
            <ValidationMessage>{errors.periodFrom}</ValidationMessage>
          </Field>

          <Field>
            <Label>Måleperiode til</Label>
            <AkselDatePicker {...periodToPickerProps}>
              <AkselDatePicker.Input 
              {...periodToInputProps} 
              aria-invalid={!!errors.periodTo}
              label
              />
            </AkselDatePicker>
            <ValidationMessage>{errors.periodTo}</ValidationMessage>
          </Field>
        </div>
      </Fieldset>

      <div style={{ display: 'flex', gap: 'var(--ds-size-3)' }}>
        <Button type='submit'>Meld dato</Button>
        <Button variant='tertiary'>Avbryt</Button>
      </div>

      {Object.keys(errors).length > 0 && (
        <ErrorSummary>
          <ErrorSummary.Heading>For å gå videre må du rette opp følgende feil:</ErrorSummary.Heading>
          <ErrorSummary.List>
            {Object.values(errors).map((message, i) => (
              <ErrorSummary.Item key={i}>
                <ErrorSummary.Link href='#'>{message}</ErrorSummary.Link>
              </ErrorSummary.Item>
            ))}
          </ErrorSummary.List>
        </ErrorSummary>
      )}
    </form>
  )
}
