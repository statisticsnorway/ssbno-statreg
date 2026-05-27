import { useState, useEffect } from 'react'
import { useParams, Link as ReactRouterLink } from 'react-router'
import { ApprovalStatusTag } from '../components/ApprovalStatus'
import {
  Heading,
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
import { DatePicker as AkselDatePicker, useDatepicker as useAkselDatePicker } from '@navikt/ds-react/DatePicker'
import { DatePicker } from '../components/DatePicker'
import {
  formatDate,
  formatVariant,
  getDateOnlyAsString,
  getFirstDayOfNthMonth,
  getLastDayOfNthMonth,
  parsePublishDateWithTime,
} from '../lib/utils'
import { CalendarIcon } from '@navikt/aksel-icons'
import { DayStatusTag } from '../components/DayStatus'
import { RowCountSelect } from '../components/RowCountSelect'
import { PaginatedReleasesTable, ReleasesTable } from '../components/ReleasesTable'
import ReleaseFormModal from '../components/ReleaseFormModal'
import {
  ApprovalStatus,
  type ReleaseByIdResponse,
  type ReleaseListing,
  type ReleaseUpdate,
  type ReleaseCreate,
  type ReleaseDetails,
} from '@ssbno-statreg/shared'

import client from '../api'

import './ReleaseForm.css'

type Statistic = ReleaseByIdResponse['statistic']
type Variant = ReleaseByIdResponse['variant']

const releaseDatePrecisions = ['Dag', 'Måned', 'År'] as const

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

function useDatepicker(
  key: keyof ReleaseFormTypes,
  setValues: React.Dispatch<React.SetStateAction<ReleaseFormTypes>>,
  setErrors: React.Dispatch<React.SetStateAction<ReleaseFormErrors>>
) {
  return useAkselDatePicker({
    onDateChange: (date) => {
      setValues((v) => ({ ...v, [key]: date }))
      setErrors((e) => ({ ...e, [key]: '' }))
    },
  })
}

//common release form for creating and editing release
export default function ReleaseForm() {
  //for creation, path is /statistikk/:shortname/:variantId/opprett
  //for editing, path is /publisering/:id/rediger
  const { id: releaseId, shortname, variantId } = useParams()

  //we use this variable when form needs to be different in editing mode
  const isEditing = !!releaseId

  //state used in both create and update mode
  const [values, setValues] = useState<ReleaseFormTypes>({})
  const [errors, setErrors] = useState<ReleaseFormErrors>({})
  const [statistic, setStatistic] = useState<Statistic>()
  const [variant, setVariant] = useState<Variant>()
  const publishTimePicker = useDatepicker('publishTime', setValues, setErrors)
  const periodFromPicker = useDatepicker('periodFrom', setValues, setErrors)
  const periodToPicker = useDatepicker('periodTo', setValues, setErrors)
  const [openReleaseModal, setOpenReleaseModal] = useState(false)
  const [newOrUpdatedRelease, setNewOrUpdatedRelease] = useState<ReleaseDetails>({})

  // when id exists in url-path, fetch release and prefill form
  useEffect(() => {
    async function setPrefilledValues() {
      if (!releaseId) return

      const { data: response } = await client.GET('/releases/{id}', {
        params: { path: { id: releaseId!.toString() } },
      })

      const loaded = {
        dateType: response?.release_date_precision,
        publishTime: parseDateFromString(response?.publish_time),
        periodFrom: parseDateFromString(response?.period_from),
        periodTo: parseDateFromString(response?.period_to),
        comment: '',
      }

      setValues(loaded)
      publishTimePicker.setSelected(loaded.publishTime)
      periodFromPicker.setSelected(loaded.periodFrom)
      periodToPicker.setSelected(loaded.periodTo)
      setStatistic(response?.statistic)
      setVariant(response?.variant)
    }

    setPrefilledValues()
  }, [releaseId])

  // when shortname and variantId exists in url-path, only fetch statistic and variant data
  useEffect(() => {
    async function fetchVariant() {
      if (!shortname || !variantId) return

      const { data: response } = await client.GET('/statistics/{shortname}', {
        params: { path: { shortname: shortname! } },
      })
      const variant = response?.variants?.find((variant) => variant.id?.toString() === variantId)
      setStatistic(response)
      setVariant({
        id: variant?.id,
        frequency: variant?.frequency,
        revision: {
          code: variant?.revision?.code,
        },
      })
    }
    fetchVariant()
  }, [shortname, variantId])

  function validateFields(): boolean {
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

    if (isEditing && !values.comment) {
      nextErrors.comment = 'Beskriv endringer som er gjort'
    }

    setErrors(nextErrors)
    const hasErrors = Object.values(nextErrors).some(Boolean)
    return !hasErrors
  }

  async function updateRelease(body: ReleaseUpdate) {
    const { data, error } = await client.PUT('/releases/{id}', {
      params: { path: { id: releaseId?.toString() ?? '' } },
      body: body,
    })

    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (error as any).error
      console.log(errorMessage)
      alert(errorMessage)
    } else {
      setOpenReleaseModal(true)
      setNewOrUpdatedRelease(data)
    }
  }

  async function createRelease(body: ReleaseCreate) {
    const { data, error } = await client.POST('/statistics/{shortname}/variants/{id}/releases', {
      params: { path: { shortname: shortname as string, id: Number(variantId) } },
      body,
    })

    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (error as any).error
      console.log(errorMessage)
      alert(errorMessage)
    } else {
      setOpenReleaseModal(true)
      setNewOrUpdatedRelease(data)
    }
  }

  function handleOnSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validateFields()) return

    const payload = {
      release_date_precision: values.dateType,
      publish_time: parsePublishDateWithTime(values.publishTime),
      period_from: getDateOnlyAsString(values.periodFrom),
      period_to: getDateOnlyAsString(values.periodTo),
      comment: values.comment,
    }

    if (isEditing) {
      updateRelease(payload)
    } else {
      createRelease(payload)
    }
  }

  return (
    <>
      <div>
        <Heading level={1} data-size='md'>
          {isEditing ? 'Rediger publiseringsdato' : 'Meld publiseringsdato'}
        </Heading>
        <Heading data-size='xs' level={2}>
          {statistic?.name} ({statistic?.shortname}) og {variant?.frequency?.name?.toLowerCase()}
        </Heading>
        <ApprovalStatusTag status={ApprovalStatus.PENDING} />
      </div>

      <form onSubmit={handleOnSubmit} className='release-form'>
        <Field>
          <Paragraph style={{ marginBottom: 'var(--ds-size-8)' }}>Alle felter må fylles ut</Paragraph>
          <Label>Datotype for publisering</Label>
          <Select
            id='dateType'
            value={values.dateType ?? ''}
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
              <Select.Option key={precision} value={precision.toLowerCase()}>
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
          <Input id='publishTime' size={10} {...publishTimePicker.inputProps} aria-invalid={!!errors.publishTime} />
          {/* TODO: Disable blocked days */}
          <DatePicker
            fromDate={getFirstDayOfNthMonth(0)}
            toDate={getLastDayOfNthMonth(0)}
            showColorCodingExplanation
            {...publishTimePicker.datepickerProps}
          />
          {errors.publishTime && <ValidationMessage>{errors.publishTime}</ValidationMessage>}
        </Field>

        <Fieldset>
          <div style={{ display: 'flex', gap: 'var(--ds-size-12)' }}>
            <Field>
              <Label>Måleperiode fra</Label>
              <AkselDatePicker {...periodFromPicker.datepickerProps}>
                <AkselDatePicker.Input
                  id='periodFrom'
                  {...periodFromPicker.inputProps}
                  aria-invalid={!!errors.periodFrom}
                  label
                />
              </AkselDatePicker>
              {errors.periodFrom && <ValidationMessage>{errors.periodFrom}</ValidationMessage>}
            </Field>

            <Field>
              <Label>Måleperiode til</Label>
              <AkselDatePicker {...periodToPicker.datepickerProps}>
                <AkselDatePicker.Input
                  id='periodTo'
                  {...periodToPicker.inputProps}
                  aria-invalid={!!errors.periodTo}
                  label
                />
              </AkselDatePicker>
              {errors.periodTo && <ValidationMessage>{errors.periodTo}</ValidationMessage>}
            </Field>
          </div>
        </Fieldset>

        {isEditing && (
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

        <div className='release-form-button-wrapper'>
          <Button type='submit'>{isEditing ? 'Lagre' : 'Meld dato'}</Button>
          <Button variant='tertiary' asChild>
            <ReactRouterLink to={isEditing ? `/publisering/${releaseId}` : `/statistikk/${statistic}`} reloadDocument>
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

      <ReleaseFormModal
        modalHeading={getReleaseModalTitle(isEditing)}
        modalDescription={getReleaseModalDescription(isEditing, newOrUpdatedRelease)}
        openCreateReleaseModal={openReleaseModal}
        newOrUpdatedRelease={newOrUpdatedRelease}
        setOpenCreateReleaseModal={setOpenReleaseModal}
      />

      <Tabs defaultValue='selected-publish-date' className='related-releases-tables-tab'>
        <Tabs.List>
          <Tabs.Tab value='selected-publish-date'>
            <CalendarIcon />
            Publiseringer på valgt dato
          </Tabs.Tab>
          <Tabs.Tab value='variant-releases'>
            Alle publiseringer på {statistic?.shortname}, {variant?.frequency?.name?.toLowerCase()}
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel className='p-0' value='selected-publish-date'>
          <div className='release-description-wrapper'>
            {/* TODO: Placeholder date and day status for description */}
            <span>Innmeldte datoer den {formatDate(values.publishTime?.toISOString())}</span>
            {/* TODO: Get status from the calendar response */}
            <DayStatusTag status={'MANY'} />
          </div>
          <DateReleasesTable selectedDate={values.publishTime} />
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

function getReleaseModalTitle(isEditing: boolean) {
  return isEditing ? 'Endringer må godkjennes' : 'Publiseringsdato er registrert'
}

function getReleaseModalDescription(isEditing: boolean, createdRelease: ReleaseDetails) {
  return isEditing
    ? 'Endringer på meldt dato må godkjennes på nytt.'
    : getCreatedReleaseModalDescription(createdRelease)
}

function getCreatedReleaseModalDescription(createdRelease: ReleaseDetails) {
  const createdReleaseVariant = formatVariant(createdRelease?.variant).toLowerCase()
  return `Datoen ${formatDate(createdRelease?.publish_time)} er nå sendt inn for ${createdReleaseVariant}.`
}

function DateReleasesTable({ selectedDate }: { selectedDate?: Date }) {
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [sortBy, setSortBy] = useState<string[]>([])

  useEffect(() => {
    // TODO: Consider moving to new function
    let publishTimeFilter = {}
    if (selectedDate) {
      const fromTime = new Date(selectedDate)
      fromTime.setHours(0, 0, 0, 0)
      const toTime = new Date(selectedDate)
      toTime.setHours(23, 59, 59, 999)

      publishTimeFilter = {
        publish_time_after: fromTime.toISOString(),
        publish_time_before: toTime.toISOString(),
      }
    }

    async function fetchReleases() {
      const { data, error } = await client.GET('/releases', {
        params: { query: { sort: sortBy.join(','), ...publishTimeFilter } },
      })
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
  }, [sortBy, selectedDate])

  return <ReleasesTable releases={releases} sortBy={sortBy} setSortBy={setSortBy} />
}

function VariantReleasesTable({ shortname, variantId }: { shortname: string; variantId: number }) {
  const [count, setCount] = useState(10)
  const [start, setStart] = useState(0)
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState<string[]>([])

  useEffect(() => {
    async function fetchVariantReleases() {
      const { data, error } = await client.GET('/statistics/{shortname}/variants/{id}/releases', {
        params: { path: { shortname, id: variantId }, query: { start, count, sort: sortBy.join(',') } },
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
  }, [shortname, variantId, count, start, sortBy])

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
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
    </>
  )
}
