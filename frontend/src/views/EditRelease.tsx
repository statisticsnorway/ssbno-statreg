import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Heading } from '@digdir/designsystemet-react'
import { ApprovalStatusTag } from '../components/ApprovalStatus'
import { Link as ReactRouterLink } from 'react-router'
import {
  Tabs,
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
import { DatePicker } from '../components/DatePicker'
import {
  getDateOnlyAsString,
  getFirstDayOfNthMonth,
  getLastDayOfNthMonth,
  getPublishDateTimeAsString,
} from '../lib/utils'
import { CalendarIcon } from '@navikt/aksel-icons'

import { DayStatusTag } from '../components/DayStatus'
import { RowCountSelect } from '../components/RowCountSelect'
import { PaginatedReleasesTable, ReleasesTable } from '../components/ReleasesTable'
import {
  ApprovalStatus,
  type ReleaseByIdResponse,
  type ReleaseListing,
  type ReleaseUpdate,
} from '@ssbno-statreg/shared'

import './ReleaseForm.css'

type Statistic = ReleaseByIdResponse['statistic']
type Variant = ReleaseByIdResponse['variant']

import client from '../api'

const releaseDatePrecisions = ['dag', 'måned', 'år'] as const

type ReleaseFormTypes = {
  dateType?: string
  publishTime?: Date
  periodFrom?: Date
  periodTo?: Date
  comment?: string
}

type ReleaseFormErrors = {
  dateType?: string
  publishTime?: string
  periodFrom?: string
  periodTo?: string
  comment?: string
}

function parseDateFromString(dateString: string | undefined): Date | undefined {
  return dateString ? new Date(dateString) : undefined
}

export default function ReleaseForm({ editReleaseId }: { editReleaseId?: number }) {
  const navigate = useNavigate()
  const [values, setValues] = useState<ReleaseFormTypes>({})
  const [errors, setErrors] = useState<ReleaseFormErrors>({})
  const [statistic, setStatistic] = useState<Statistic>()
  const [variant, setVariant] = useState<Variant>()

  const { datepickerProps: publishTimePickerProps, inputProps: publishTimeInputProps } = useDatepicker({
    defaultSelected: values.publishTime,
    onDateChange: (publishTime) => {
      setValues((values) => ({ ...values, publishTime: publishTime }))
      setErrors((errors) => ({ ...errors, publishTime: '' }))
    },
  })
  const { datepickerProps: periodFromPickerProps, inputProps: periodFromInputProps } = useDatepicker({
    defaultSelected: values.periodFrom,
    onDateChange: (periodFrom) => {
      setValues((values) => ({ ...values, periodFrom: periodFrom }))
      setErrors((errors) => ({ ...errors, periodFrom: '' }))
    },
  })
  const { datepickerProps: periodToPickerProps, inputProps: periodToInputProps } = useDatepicker({
    defaultSelected: values.periodTo,
    onDateChange: (periodTo) => {
      setValues((values) => ({ ...values, periodTo: periodTo }))
      setErrors((errors) => ({ ...errors, periodTo: '' }))
    },
  })

  useEffect(() => {
    async function fetchRelease() {
      const { data: response, error } = await client.GET('/releases/{id}', {
        params: { path: { id: editReleaseId?.toString() ?? '' } },
      })
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setStatistic(() => response.statistic)
        setVariant(() => response.variant)
        setValues((values) => ({
          ...values,
          dateType: response.release_date_precision,
          publishTime: parseDateFromString(response.publish_time),
          periodFrom: parseDateFromString(response.period_from),
          periodTo: parseDateFromString(response.period_to),
        }))
      }
    }
    fetchRelease()
  }, [editReleaseId])

  async function updateRelease(payload: ReleaseUpdate) {
    const { data, error } = await client.PUT('/releases/{id}', {
      params: { path: { id: editReleaseId?.toString() ?? '' } },
      body: payload,
    })

    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (error as any).error
      console.log(errorMessage)
      alert(errorMessage)
    } else {
      navigate(`/publisering/${data?.id}`)
    }
  }

  function validateFields() {
    const nextErrors: ReleaseFormErrors = {}

    if (!values.dateType) nextErrors.dateType = 'Velg en datotype for publisering'
    if (!values.publishTime) nextErrors.publishTime = 'Opprett en gyldig publiseringsdato'
    if (!values.periodFrom) nextErrors.periodFrom = 'Opprett en gyldig fra-dato'
    if (!values.periodTo) nextErrors.periodTo = 'Opprett en gyldig til-dato'

    // TODO: MIM-2582: Review comparison logic, error messages, and implement onChange
    if (values.periodFrom && values.periodTo && values.periodFrom > values.periodTo) {
      nextErrors.periodFrom = 'Fra-dato kan ikke være etter til-dato'
      nextErrors.periodTo = 'Til-dato kan ikke være før fra-dato'
    }

    if (editReleaseId && !values.comment) {
      nextErrors.comment = 'Beskriv endringer som er gjort'
    }

    setErrors(nextErrors)
    return !nextErrors
  }

  function handleOnSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validateFields()) return

    const payload = {
      release_date_precision: values.dateType,
      publish_time: getPublishDateTimeAsString(values.publishTime),
      period_from: getDateOnlyAsString(values.periodFrom),
      period_to: getDateOnlyAsString(values.periodTo),
      comment: values.comment,
    }

    if (editReleaseId) {
      updateRelease(payload)
    } else {
      return
    }
  }

  return (
    <>
      <div>
        <Heading level={1} data-size='md'>
          Rediger publiseringsdato
        </Heading>
        <Heading data-size='xs' level={2}>
          {statistic?.name} ({statistic?.shortname}) og {variant?.frequency?.name}
        </Heading>
        <ApprovalStatusTag status={ApprovalStatus.PENDING} />
      </div>
      <form onSubmit={handleOnSubmit} className='release-form'>
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

        {editReleaseId && (
          <Field>
            <Label>Kommentar</Label>
            <Field.Description>Beskriv kort årsaken til endringen</Field.Description>
            <Textarea
              id='comment'
              rows={6}
              value={values.comment}
              onChange={(e) => {
                setValues((values) => ({ ...values, comment: e.target.value }))
                setErrors((errors) => ({ ...errors, comment: '' }))
              }}
            />
            {errors.comment && <ValidationMessage>{errors.comment}</ValidationMessage>}
          </Field>
        )}

        <div style={{ display: 'flex', gap: 'var(--ds-size-3)' }}>
          <Button type='submit'>{editReleaseId ? 'Lagre' : 'Meld dato'}</Button>
          <Button variant='tertiary' asChild>
            <ReactRouterLink
              to={editReleaseId ? `/publisering/${editReleaseId}` : `/statistikk/${statistic}`}
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

      <Tabs defaultValue='selected-publish-date' className='related-releases-tables-tab'>
        <Tabs.List>
          <Tabs.Tab value='selected-publish-date'>
            <CalendarIcon />
            Publiseringer på valgt dato
          </Tabs.Tab>
          <Tabs.Tab value='variant-releases'>Alle publiseringer på {variant?.frequency?.name}</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel className='p-0' value='selected-publish-date'>
          <div className='description-wrapper'>
            {/* TODO: Placeholder date and day status for description */}
            <span>Innmeldte datoer den {values.publishTime?.toLocaleDateString()}</span>
            {/* TODO: Get status from the calendar response */}
            <DayStatusTag status={'MANY'} />
          </div>
          <DateReleasesTable />
        </Tabs.Panel>
        <Tabs.Panel className='p-0' value='variant-releases'>
          {statistic && variant && (
            <VariantReleasesTable shortname={statistic.shortname as string} variantId={variant.id as number} />
          )}
        </Tabs.Panel>
      </Tabs>
    </>
  )
}

// TODO should take a date prop
function DateReleasesTable() {
  const [releases, setReleases] = useState<ReleaseListing[]>([])

  useEffect(() => {
    async function fetchReleases() {
      const { data, error } = await client.GET('/releases', { params: { query: { start: 0, count: 10 } } })
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setReleases(data?.releases ?? [])
      }
    }
    fetchReleases()
  }, [])

  return <ReleasesTable releases={releases} />
}

function VariantReleasesTable({ shortname, variantId }: { shortname: string; variantId: number }) {
  const [count, setCount] = useState(10)
  const [start, setStart] = useState(0)
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    async function fetchVariantReleases() {
      const { data, error } = await client.GET('/statistics/{shortname}/variants/{id}/releases', {
        params: { path: { shortname, id: variantId }, query: { start, count } },
      })
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setReleases(data?.releases ?? [])
        setTotal(data.total ?? 0)
      }
    }
    fetchVariantReleases()
  }, [shortname, variantId, count, start])

  function updateRowCount(newCount: number) {
    setCount(newCount)
    setStart(0)
  }

  function setCurrentPage(currentPage: number) {
    setStart((currentPage - 1) * count)
  }

  return (
    <>
      <div className='row-count-select-wrapper'>
        <RowCountSelect selectedRowCount={count} updateRowCount={updateRowCount} />
      </div>
      <PaginatedReleasesTable
        start={start}
        count={count}
        total={total}
        releases={releases}
        setCurrentPage={setCurrentPage}
      />
    </>
  )
}
