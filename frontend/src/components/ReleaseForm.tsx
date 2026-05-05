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
    onDateChange: (publishTime) => {
      if (publishTime) {
        setPublishTime(publishTime.toLocaleString())
        setErrors({ ...errors, publishDate: '' })
      }
    },
  })
  const { datepickerProps: periodFromPickerProps, inputProps: periodFromInputProps } = useDatepicker({
    onDateChange: (periodFrom) => {
      if (periodFrom) {
        setPeriodTo(getDateOnlyAsString(periodFrom))
        setErrors({ ...errors, periodFrom: '' })
      }
    },
  })
  const { datepickerProps: periodToPickerProps, inputProps: periodToInputProps } = useDatepicker({
    onDateChange: (periodTo) => {
      if (periodTo) {
        setPeriodFrom(getDateOnlyAsString(periodTo))
        setErrors({ ...errors, periodTo: '' })
      }
    },
  })

  const start = getFirstDayOfNthMonth(0)
  const stop = getLastDayOfNthMonth(0)

  function validateFields() {
    const nextErrors: ReleaseFormErrors = {}

    if (!dateType) nextErrors.dateType = 'Velg en datotype for publisering'
    if (!publishTime) nextErrors.publishDate = 'Velg en publiseringsdato'
    if (!periodFrom) nextErrors.periodFrom = 'Velg en fra-dato'
    if (!periodTo) nextErrors.periodTo = 'Velg en til-dato'

    // TODO: Needs date to do comparisons
    if (periodFrom && periodTo && periodFrom > periodTo) {
      nextErrors.periodFrom = 'Fra-dato kan ikke være etter til-dato'
      nextErrors.periodTo = 'Til-dato kan ikke være før fra-dato'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validateFields()) return

    console.log({ dateType, publishTime, periodFrom, periodTo }) // TODO: Replace with PUT logic
  }

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-size-12)' }}>
        <Field>
          <Paragraph style={{ marginBottom: 'var(--ds-size-8)' }}>Alle felter må fylles ut</Paragraph>
          <Label>Datotype for publisering</Label>
          <Select
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
              <Select.Option value={precision}>{precision}</Select.Option>
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
          <Input size={10} {...publishTimeInputProps} aria-invalid={!!errors.publishDate} />
          <DatePicker fromDate={start} toDate={stop} showColorCodingExplanation {...publishTimePickerProps} />
          {errors.publishDate && <ValidationMessage>{errors.publishDate}</ValidationMessage>}
        </Field>

        <Fieldset>
          <div style={{ display: 'flex', gap: 'var(--ds-size-12)' }}>
            <Field>
              <Label>Måleperiode fra</Label>
              <AkselDatePicker {...periodFromPickerProps}>
                <AkselDatePicker.Input {...periodFromInputProps} aria-invalid={!!errors.periodFrom} label />
              </AkselDatePicker>
              {errors.periodFrom && <ValidationMessage>{errors.periodFrom}</ValidationMessage>}
            </Field>

            <Field>
              <Label>Måleperiode til</Label>
              <AkselDatePicker {...periodToPickerProps}>
                <AkselDatePicker.Input {...periodToInputProps} aria-invalid={!!errors.periodTo} label />
              </AkselDatePicker>
              {errors.periodTo && <ValidationMessage>{errors.periodTo}</ValidationMessage>}
            </Field>
          </div>
        </Fieldset>

        <div style={{ display: 'flex', gap: 'var(--ds-size-3)' }}>
          <Button type='submit'>Meld dato</Button>
          <Button variant='tertiary'>Avbryt</Button>
        </div>
      </form>

      {Object.values(errors).some(Boolean) && (
        <ErrorSummary>
          <ErrorSummary.Heading>For å gå videre må du rette opp følgende feil:</ErrorSummary.Heading>
          <ErrorSummary.List>
            {Object.values(errors).map((message, i) => {
              if (message) {
                return (
                  <ErrorSummary.Item key={i}>
                    <ErrorSummary.Link href='#'>{message}</ErrorSummary.Link>
                  </ErrorSummary.Item>
                )
              }
            })}
          </ErrorSummary.List>
        </ErrorSummary>
      )}
    </>
  )
}
