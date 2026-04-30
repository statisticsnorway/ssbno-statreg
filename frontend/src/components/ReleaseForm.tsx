import { useState } from 'react'
import { Heading, Paragraph, Select, Button, Fieldset, Field, Label, Input } from '@digdir/designsystemet-react'
import { DatePicker as AkselDatePicker, useDatepicker } from '@navikt/ds-react/DatePicker'
import { ApprovalStatusTag } from './ApprovalStatus'
import { DatePicker } from './DatePicker'
import { ApprovalStatus } from '@ssbno-statreg/shared'

const releaseDatePrecisions = ['Dag', 'Måned', 'År']

export function ReleaseForm() {
  const [dateType, setDateType] = useState('')
  const { datepickerProps: publishTimePickerProps, inputProps: publishTimeInputProps } = useDatepicker()
  const { datepickerProps: periodFromPickerProps, inputProps: periodFromInputProps } = useDatepicker()
  const { datepickerProps: periodToPickerProps, inputProps: periodToInputProps } = useDatepicker()

  const start = new Date()
  const stop = new Date()
  stop.setFullYear(start.getFullYear() + 3)

  return (
    <>
      <div>
        <Heading data-size='xs' level={2}>
          Statistikknavn (kortnavn) og variant
        </Heading>
        <ApprovalStatusTag status={ApprovalStatus.PENDING} />
      </div>

      <Paragraph>Alle felter må fylles ut</Paragraph>

      <Field>
        <Label>Datotype for publisering</Label>
        <Select value={dateType} onChange={(e) => setDateType(e.target.value)}>
          <Select.Option value='' disabled>
            Velg datotype
          </Select.Option>
          {releaseDatePrecisions.map((precision) => (
            <Select.Option value={precision}>{precision}</Select.Option>
          ))}
        </Select>
      </Field>

      <Field>
        <Label>Publiseringsdato</Label>
        <Field.Description>
          Nye datoer og endringer må meldes minst 3 måneder i forveien. For kortere frister, kontakt desken@ssb.no.
        </Field.Description>
        <Input size={10} {...publishTimeInputProps} />
        <DatePicker fromDate={start} toDate={stop} showColorCodingExplanation {...publishTimePickerProps} />
      </Field>

      <Fieldset>
        <div style={{ display: 'flex', gap: 'var(--ds-size-12MIM 2665 MIM 2665 )' }}>
          <Field>
            <Label>Måleperiode fra</Label>
            <Field.Description>dd.mm.åååå</Field.Description>
            <AkselDatePicker {...periodFromPickerProps}>
              <AkselDatePicker.Input {...periodFromInputProps} label />
            </AkselDatePicker>
          </Field>
          <Field>
            <Label>Måleperiode til</Label>
            <Field.Description>dd.mm.åååå</Field.Description>
            <AkselDatePicker {...periodToPickerProps}>
              <AkselDatePicker.Input {...periodToInputProps} label />
            </AkselDatePicker>
          </Field>
        </div>
      </Fieldset>

      <div style={{ display: 'flex', gap: 'var(--ds-size-3)' }}>
        <Button>Meld dato</Button>
        <Button variant='tertiary'>Avbryt</Button>
      </div>
    </>
  )
}
