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
import {
  getDateOnlyAsString,
  getFirstDayOfNthMonth,
  getLastDayOfNthMonth,
  parsePublishDateWithTime,
} from '../lib/utils'

import client from '../api'
import type { ReleaseCreate } from '@ssbno-statreg/shared'

const releaseDatePrecisions = ['Dag', 'Måned', 'År']

type ReleaseFormProps = {
  shortname: string
  variantId: number
}

type ReleaseFormTypes = {
  dateType?: string
  publishTime?: string
  periodFrom?: string
  periodTo?: string
}

async function createRelease(shortname: string, variantId: number, body: ReleaseCreate) {
  const { data, error } = await client.POST('/statistics/{shortname}/variants/{id}/releases', {
    params: { path: { shortname, id: variantId } },
    body,
  })

  if (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorMessage = (error as any).error
    console.log(errorMessage)
    alert(errorMessage)
  } else {
    // TODO: Implement Dialog for created release verification
    alert('Release created: ' + JSON.stringify(data, null, 2))
  }
}

export function ReleaseForm({ shortname, variantId }: ReleaseFormProps) {
  const [values, setValues] = useState<ReleaseFormTypes>({
    dateType: '',
    publishTime: '',
    periodFrom: '',
    periodTo: '',
  })
  const [periodToDate, setPeriodToDate] = useState<Date | undefined>()
  const [periodFromDate, setPeriodFromDate] = useState<Date | undefined>()
  const [errors, setErrors] = useState<ReleaseFormTypes>({
    dateType: '',
    publishTime: '',
    periodFrom: '',
    periodTo: '',
  })

  // TODO: Add validation for Date inputs; it's currently allowed to write anything on the fields
  const { datepickerProps: publishTimePickerProps, inputProps: publishTimeInputProps } = useDatepicker({
    onDateChange: (publishTime) => {
      setValues((values) => ({ ...values, publishTime: parsePublishDateWithTime(publishTime) }))
      setErrors((errors) => ({ ...errors, publishTime: '' }))
    },
  })
  const { datepickerProps: periodFromPickerProps, inputProps: periodFromInputProps } = useDatepicker({
    onDateChange: (periodFrom) => {
      setPeriodFromDate(periodFrom)
      setValues((values) => ({ ...values, periodFrom: getDateOnlyAsString(periodFrom) }))
      setErrors((errors) => ({ ...errors, periodFrom: '' }))
    },
  })
  const { datepickerProps: periodToPickerProps, inputProps: periodToInputProps } = useDatepicker({
    onDateChange: (periodTo) => {
      setPeriodToDate(periodTo)
      setValues((values) => ({ ...values, periodTo: getDateOnlyAsString(periodTo) }))
      setErrors((errors) => ({ ...errors, periodTo: '' }))
    },
  })

  function validateFields() {
    const nextErrors: ReleaseFormTypes = {}

    if (!values.dateType) nextErrors.dateType = 'Velg en datotype for publisering'
    if (!values.publishTime) nextErrors.publishTime = 'Velg en publiseringsdato'
    if (!values.periodFrom) nextErrors.periodFrom = 'Velg en fra-dato'
    if (!values.periodTo) nextErrors.periodTo = 'Velg en til-dato'

    // TODO: MIM-2582: Review comparison logic, error messages, and implement onChange
    if (periodFromDate && periodToDate && periodFromDate > periodToDate) {
      nextErrors.periodFrom = 'Fra-dato kan ikke være etter til-dato'
      nextErrors.periodTo = 'Til-dato kan ikke være før fra-dato'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).some((key) => nextErrors[key as keyof ReleaseFormTypes]) ? false : true
  }

  function handleOnSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validateFields()) return

    createRelease(shortname, variantId, {
      release_date_precision: values.dateType,
      publish_time: values.publishTime,
      period_from: values.periodFrom,
      period_to: values.periodTo,
    })
  }

  return (
    <form onSubmit={handleOnSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-size-12)' }}>
      <Field>
        <Paragraph style={{ marginBottom: 'var(--ds-size-8)' }}>Alle felter må fylles ut</Paragraph>
        <Label>Datotype for publisering</Label>
        <Select
          id='dateType'
          value={values.dateType}
          onChange={(e) => {
            setValues((values) => ({ ...values, dateType: e.target.value }))
            setErrors((errors) => ({ ...errors, dateType: '' }))
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
        {/* TODO: Disable blocked days */}
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
