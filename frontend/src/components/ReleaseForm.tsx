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

export function ReleaseForm() {
  const [dateType, setDateType] = useState('')
  const { datepickerProps: publishTimePickerProps, inputProps: publishTimeInputProps } = useDatepicker()
  const { datepickerProps: periodFromPickerProps, inputProps: periodFromInputProps } = useDatepicker()
  const { datepickerProps: periodToPickerProps, inputProps: periodToInputProps } = useDatepicker()

  const start = getFirstDayOfNthMonth(0)
  const stop = getLastDayOfNthMonth(0)

  return (
    <>
      <Field>
        <Paragraph style={{ marginBottom: 'var(--ds-size-8)' }}>Alle felter må fylles ut</Paragraph>
        <Label>Datotype for publisering</Label>
        <Select value={dateType} onChange={(e) => setDateType(e.target.value)}>
          <Select.Option value='' disabled>
            Velg datotype
          </Select.Option>
          {releaseDatePrecisions.map((precision) => (
            <Select.Option value={precision}>{precision}</Select.Option>
          ))}
        </Select>
        <ValidationMessage>Velg en datotype for publisering</ValidationMessage>
      </Field>

      <Field>
        <Label>Publiseringsdato</Label>
        <Field.Description>
          Nye datoer og endringer må meldes minst 3 måneder i forveien. <br />
          For kortere frister, kontakt desken@ssb.no.
        </Field.Description>
        <Input size={10} {...publishTimeInputProps} />
        <DatePicker fromDate={start} toDate={stop} showColorCodingExplanation {...publishTimePickerProps} />
        <ValidationMessage>Velg en publiseringsdato</ValidationMessage>
      </Field>

      <Fieldset>
        <div style={{ display: 'flex', gap: 'var(--ds-size-12)' }}>
          <Field>
            <Label>Måleperiode fra</Label>
            <AkselDatePicker {...periodFromPickerProps}>
              <AkselDatePicker.Input style={{ padding: '0' }} {...periodFromInputProps} label />
            </AkselDatePicker>
            <ValidationMessage>Velg en fra-dato</ValidationMessage>
          </Field>
          <Field>
            <Label>Måleperiode til</Label>
            <AkselDatePicker {...periodToPickerProps}>
              <AkselDatePicker.Input style={{ padding: '0' }} {...periodToInputProps} label />
            </AkselDatePicker>
            <ValidationMessage>Velg en til-dato</ValidationMessage>
          </Field>
        </div>
      </Fieldset>

      <div style={{ display: 'flex', gap: 'var(--ds-size-3)' }}>
        <Button>Meld dato</Button>
        <Button variant='tertiary'>Avbryt</Button>
      </div>

      <ErrorSummary>
        <ErrorSummary.Heading>For å gå videre må du rette opp følgende feil:</ErrorSummary.Heading>
        <ErrorSummary.List>
          <ErrorSummary.Item>
            <ErrorSummary.Link href='#'>Velg en publiseringsdato</ErrorSummary.Link>
          </ErrorSummary.Item>
        </ErrorSummary.List>
      </ErrorSummary>
    </>
  )
}
