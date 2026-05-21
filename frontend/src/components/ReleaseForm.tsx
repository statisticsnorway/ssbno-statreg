import { useState } from 'react'
import { Link as ReactRouterLink } from 'react-router'
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
  Textarea,
} from '@digdir/designsystemet-react'
import { DatePicker as AkselDatePicker, useDatepicker } from '@navikt/ds-react/DatePicker'
import { DatePicker } from './DatePicker'
import {
  getDateOnlyAsString,
  getFirstDayOfNthMonth,
  getLastDayOfNthMonth,
  getPublishDateTimeAsString,
} from '../lib/utils'
import { type ReleaseCreate, type ReleaseUpdate } from '@ssbno-statreg/shared'

const releaseDatePrecisions = ['dag', 'måned', 'år']

type ReleaseFormErrors = {
  dateType?: string
  publishTime?: string
  periodFrom?: string
  periodTo?: string
  comment?: string
}

type ReleaseFormProps = {
  onFormSubmit: (body: ReleaseCreate | ReleaseUpdate) => Promise<void>
  shortname: string
  initialValues?: ReleaseUpdate
}

function parseDateFromString(dateString: string | undefined): Date | undefined {
  return dateString ? new Date(dateString) : undefined
}

export function ReleaseForm({ onFormSubmit, shortname, initialValues }: ReleaseFormProps) {
  const [dateType, setDateType] = useState<string>(initialValues?.release_date_precision ?? '')
  const [publishTimeDate, setPublishTimeDate] = useState<Date | undefined>(
    parseDateFromString(initialValues?.publish_time)
  )
  const [periodToDate, setPeriodToDate] = useState<Date | undefined>(parseDateFromString(initialValues?.period_to))
  const [periodFromDate, setPeriodFromDate] = useState<Date | undefined>(
    parseDateFromString(initialValues?.period_from)
  )
  const [comment, setComment] = useState<string>(initialValues?.comment ?? '')
  const [errors, setErrors] = useState<ReleaseFormErrors>({})
  const { datepickerProps: publishTimePickerProps, inputProps: publishTimeInputProps } = useDatepicker({
    defaultSelected: publishTimeDate,
    onDateChange: (publishTime) => {
      setPublishTimeDate(publishTime)
      setErrors((errors) => ({ ...errors, publishTime: '' }))
    },
  })
  const { datepickerProps: periodFromPickerProps, inputProps: periodFromInputProps } = useDatepicker({
    defaultSelected: periodFromDate,
    onDateChange: (periodFrom) => {
      setPeriodFromDate(periodFrom)
      setErrors((errors) => ({ ...errors, periodFrom: '' }))
    },
  })
  const { datepickerProps: periodToPickerProps, inputProps: periodToInputProps } = useDatepicker({
    defaultSelected: periodToDate,
    onDateChange: (periodTo) => {
      setPeriodToDate(periodTo)
      setErrors((errors) => ({ ...errors, periodTo: '' }))
    },
  })

  function validateFields() {
    const nextErrors: ReleaseFormErrors = {}

    if (!dateType) nextErrors.dateType = 'Velg en datotype for publisering'
    if (!publishTimeDate) nextErrors.publishTime = 'Opprett en gyldig publiseringsdato'
    if (!periodFromDate) nextErrors.periodFrom = 'Opprett en gyldig fra-dato'
    if (!periodToDate) nextErrors.periodTo = 'Opprett en gyldig til-dato'

    // TODO: MIM-2582: Review comparison logic, error messages, and implement onChange
    if (periodFromDate && periodToDate && periodFromDate > periodToDate) {
      nextErrors.periodFrom = 'Fra-dato kan ikke være etter til-dato'
      nextErrors.periodTo = 'Til-dato kan ikke være før fra-dato'
    }

    if (initialValues && !comment) {
      nextErrors.comment = 'Beskriv endringer som er gjort'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).some((key) => nextErrors[key as keyof ReleaseFormErrors]) ? false : true
  }

  function handleOnSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validateFields()) return

    const data = {
      release_date_precision: dateType,
      publish_time: getPublishDateTimeAsString(publishTimeDate),
      period_from: getDateOnlyAsString(periodFromDate),
      period_to: getDateOnlyAsString(periodToDate),
    }

    if (initialValues) {
      onFormSubmit({ ...data, comment })
    } else {
      onFormSubmit(data)
    }
  }

  return (
    <form onSubmit={handleOnSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-size-12)' }}>
      <Field>
        <Paragraph style={{ marginBottom: 'var(--ds-size-8)' }}>Alle felter må fylles ut</Paragraph>
        <Label>Datotype for publisering</Label>
        <Select
          id='dateType'
          value={dateType}
          onChange={(e) => {
            setDateType(e.target.value)
            setErrors((errors) => ({ ...errors, dateType: '' }))
          }}
          aria-invalid={!!errors.dateType}
        >
          <Select.Option value='' disabled>
            Velg datotype
          </Select.Option>
          {releaseDatePrecisions.map((precision) => (
            <Select.Option key={precision} value={precision}>
              {precision.charAt(0).toUpperCase() + precision.slice(1)}
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

      {initialValues && (
        <Field>
          <Label>Kommentar</Label>
          <Field.Description>Beskriv kort årsaken til endringen</Field.Description>
          <Textarea id='comment' rows={6} value={comment} onChange={(e) => setComment(e.target.value)} />
          {errors.comment && <ValidationMessage>{errors.comment}</ValidationMessage>}
        </Field>
      )}

      <div style={{ display: 'flex', gap: 'var(--ds-size-3)' }}>
        <Button type='submit'>{initialValues ? 'Lagre' : 'Meld dato'}</Button>
        <Button variant='tertiary' asChild>
          <ReactRouterLink
            to={initialValues?.id ? `/publisering/${initialValues.id}` : `/statistikk/${shortname}`}
            reloadDocument
          >
            Avbryt
          </ReactRouterLink>
        </Button>
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
