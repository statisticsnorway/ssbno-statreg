import { useState } from 'react'
import { Heading, Paragraph, Select, Button, Fieldset, Field, Label, Input } from '@digdir/designsystemet-react'
import { DatePicker as AkselDatePicker, useDatepicker } from '@navikt/ds-react/DatePicker'
import { ApprovalStatusTag } from '../components/ApprovalStatus'
import { DatePicker } from '../components/DatePicker'
import { ApprovalStatus } from '@ssbno-statreg/shared'
import type { CalenderDate } from '@ssbno-statreg/shared'

const mockCalendarDates: CalenderDate = {
  '2026-01-15': { status: 'full' },
  '2026-02-10': { status: 'more' },
  '2026-03-20': { status: 'few' },
  '2026-04-05': { status: 'blocked' },
}

const mockApprovalStatus = ApprovalStatus.PENDING

const publishTimePrecisions = ['Dag', 'Måned', 'År']

export function Test() {
  const [dateType, setDateType] = useState('')

  const { datepickerProps: fromProps, inputProps: fromInputProps } = useDatepicker({
    onDateChange: () => {},
  })
  const { datepickerProps: toProps, inputProps: toInputProps } = useDatepicker({
    onDateChange: () => {},
  })

  return (
    <>
      <div>
        <Heading data-size='lg' level={1}>
          Meld publiseringsdato
        </Heading>
        <Heading data-size='xs' level={2}>
          Statistikknavn (kortnavn) og variant
        </Heading>
        <ApprovalStatusTag status={mockApprovalStatus} />
      </div>

      <Paragraph>Alle felter må fylles ut</Paragraph>

      <Field>
        <Label>Datotype for publisering</Label>
        <Select id='date-type' value={dateType} onChange={(e) => setDateType(e.target.value)}>
          <Select.Option value=''>Velg datotype</Select.Option>
          {publishTimePrecisions.map((precision) => (
            <Select.Option value='{precision}'>{precision}</Select.Option>
          ))}
        </Select>
      </Field>

      <Field>
        <Label>Publiseringsdato</Label>
        <Field.Description>
          Nye datoer og endringer må meldes minst 3 måneder i forveien. For kortere frister, kontakt desken@ssb.no.
        </Field.Description>
        <DatePicker calendarDates={mockCalendarDates} showColorCodingExplanation></DatePicker>
      </Field>

      <Fieldset>
        <Field>
          <Label>Måleperiode fra</Label>
          <Field.Description>dd.mm.åååå</Field.Description>
          <AkselDatePicker {...fromProps}>
            <AkselDatePicker.Input {...fromInputProps} label />
          </AkselDatePicker>
        </Field>
        <Field>
          <Label>Måleperiode fra</Label>
          <Field.Description>dd.mm.åååå</Field.Description>
          <AkselDatePicker {...toProps}>
            <AkselDatePicker.Input {...toInputProps} label />
          </AkselDatePicker>
        </Field>
      </Fieldset>

      <div style={{ display: 'flex', gap: 'var(--ds-size-4)' }}>
        <Button>Meld dato</Button>
        <Button variant='tertiary'>Avbryt</Button>
      </div>
    </>
  )
}
