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
import { getDateOnlyAsString, getFirstDayOfNthMonth, getLastDayOfNthMonth } from '../lib/utils'

const releaseDatePrecisions = ['Dag', 'Måned', 'År']

type ReleaseFormErrors = {
  dateType?: string
  publishTime?: string
  periodFrom?: string
  periodTo?: string
}

export function ReleaseForm() {
  const [dateType, setDateType] = useState('')
  const [publishTime, setPublishTime] = useState('')
  const [periodFromDate, setPeriodFromDate] = useState<Date | undefined>()
  const [periodFrom, setPeriodFrom] = useState('')
  const [periodToDate, setPeriodToDate] = useState<Date | undefined>()
  const [periodTo, setPeriodTo] = useState('')
  const [errors, setErrors] = useState<ReleaseFormErrors>({})

  const { datepickerProps: publishTimePickerProps, inputProps: publishTimeInputProps } = useDatepicker({
    onDateChange: (publishTime) => {
      if (!publishTime) return
      setPublishTime(getDateOnlyAsString(publishTime))
      setErrors((prev) => ({ ...prev, publishTime: '' }))
    },
  })
  const { datepickerProps: periodFromPickerProps, inputProps: periodFromInputProps } = useDatepicker({
    onDateChange: (periodFrom) => {
      if (!periodFrom) return
      setPeriodFromDate(periodFrom)
      setPeriodFrom(getDateOnlyAsString(periodFrom))
    },
  })
  const { datepickerProps: periodToPickerProps, inputProps: periodToInputProps } = useDatepicker({
    onDateChange: (periodTo) => {
      if (!periodTo) return
      setPeriodToDate(periodTo)
      setPeriodTo(getDateOnlyAsString(periodTo))
    },
  })

  function validateFields() {
    const nextErrors: ReleaseFormErrors = {}

    if (!dateType) nextErrors.dateType = 'Velg en datotype for publisering'
    if (!publishTime) nextErrors.publishTime = 'Velg en publiseringsdato'
    if (!periodFrom) nextErrors.periodFrom = 'Velg en fra-dato'
    if (!periodTo) nextErrors.periodTo = 'Velg en til-dato'

    if (periodFromDate && periodToDate && periodFromDate > periodToDate) {
      nextErrors.periodFrom = 'Fra-dato kan ikke være etter til-dato'
      nextErrors.periodTo = 'Til-dato kan ikke være før fra-dato'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validateFields()) return

    // TODO: Replace with POST logic
    console.log({ dateType, publishTime, periodFrom, periodTo })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-size-12)' }}>
      <Field>
        <Paragraph style={{ marginBottom: 'var(--ds-size-8)' }}>Alle felter må fylles ut</Paragraph>
        <Label>Datotype for publisering</Label>
        <Select
          id='dateType'
          value={dateType}
          onChange={(e) => {
            setDateType(e.target.value)
            setErrors({ ...errors, dateType: '' })
          }}
          aria-invalid={!!errors.dateType}
        >
          <Select.Option value='' disabled>
            Velg datotype
          </Select.Option>
          {releaseDatePrecisions.map((precision) => (
            <Select.Option key={precision} value={precision}>
              {precision}
            </Select.Option>
          ))}
        </Select>
        {errors.dateType && <ValidationMessage>{errors.dateType}</ValidationMessage>}
      </Field>

      <Field>
        <Label>Publiseringsdato</Label>
        <Field.Description>
          Nye datoer og endringer må meldes minst 3 måneder i forveien. <br />
          For kortere frister, kontakt mmj@ssb.no.
        </Field.Description>
        <Input id='publishTime' size={10} {...publishTimeInputProps} aria-invalid={!!errors.publishTime} />
        <DatePicker
          fromDate={getFirstDayOfNthMonth(0)}
          toDate={getLastDayOfNthMonth(0)}
          showColorCodingExplanation
          {...publishTimePickerProps}
        />
        {errors.publishTime && <ValidationMessage>{errors.publishTime}</ValidationMessage>}
      </Field>

      <Fieldset>
        <div style={{ display: 'flex', gap: 'var(--ds-size-12)' }}>
          <Field>
            <Label>Måleperiode fra</Label>
            <AkselDatePicker {...periodFromPickerProps}>
              <AkselDatePicker.Input
                id='periodFrom'
                {...periodFromInputProps}
                aria-invalid={!!errors.periodFrom}
                label
              />
            </AkselDatePicker>
            {errors.periodFrom && <ValidationMessage>{errors.periodFrom}</ValidationMessage>}
          </Field>

          <Field>
            <Label>Måleperiode til</Label>
            <AkselDatePicker {...periodToPickerProps}>
              <AkselDatePicker.Input id='periodTo' {...periodToInputProps} aria-invalid={!!errors.periodTo} label />
            </AkselDatePicker>
            {errors.periodTo && <ValidationMessage>{errors.periodTo}</ValidationMessage>}
          </Field>
        </div>
      </Fieldset>

      <div style={{ display: 'flex', gap: 'var(--ds-size-3)' }}>
        <Button type='submit'>Meld dato</Button>
        <Button variant='tertiary'>Avbryt</Button>
      </div>

      {Object.values(errors).some(Boolean) && (
        <ErrorSummary>
          <ErrorSummary.Heading>For å gå videre må du rette opp følgende feil:</ErrorSummary.Heading>
          <ErrorSummary.List>
            {Object.entries(errors).map(([key, message]) => {
              if (message) {
                return (
                  <ErrorSummary.Item key={message}>
                    <ErrorSummary.Link href={`#${key}`}>{message}</ErrorSummary.Link>
                  </ErrorSummary.Item>
                )
              }
            })}
          </ErrorSummary.List>
        </ErrorSummary>
      )}
    </form>
  )
}
