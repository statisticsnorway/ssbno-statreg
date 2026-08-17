import { useState, useEffect, useRef } from 'react'
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
import {
  DatePicker as AkselDatePicker,
  type DateValidationT,
  useDatepicker as useAkselDatePicker,
} from '@navikt/ds-react/DatePicker'
import { DatePicker } from '../components/DatePicker'
import { suggestNextRelease } from '../lib/suggestions'
import {
  formatDate,
  formatVariant,
  getDateOnlyAsString,
  parsePublishDateWithTime,
  getPublishTimeFilterForDate,
} from '../lib/utils'
import { CalendarIcon } from '@navikt/aksel-icons'
import { DayStatusTag } from '../components/DayStatus'
import { RowCountSelect } from '../components/RowCountSelect'
import { PaginatedReleasesTable, ReleasesTable } from '../components/ReleasesTable'
import ReleaseFormModal from '../components/ReleaseFormModal'
import {
  ApprovalStatus,
  DayStatus,
  type ReleaseByIdResponse,
  type ReleaseListing,
  type ReleaseUpdate,
  type ReleaseCreate,
  type ReleaseDetails,
  type CalenderDate,
} from '@ssbno-statreg/shared'

import client from '../api'

import './ReleaseForm.css'
import { useAuth } from '../context/AuthContext'
import { ErrorAlert } from '../components/ErrorAlert'

type Statistic = ReleaseByIdResponse['statistic'] & {
  approval_status?: ReleaseByIdResponse['approval_status']
}
type Variant = ReleaseByIdResponse['variant']

const releaseDatePrecisions = ['Dag', 'Måned', 'År'] as const

type ReleaseFormTypes = {
  dateType?: string
  publishTime?: Date
  periodFrom?: Date
  periodTo?: Date
  comment?: string
}

type ReleaseFormField = keyof ReleaseFormTypes

type ReleaseFormErrors = {
  dateType?: string
  publishTime?: string
  periodFrom?: string
  periodTo?: string
  comment?: string
}

type ReleaseDateField = 'publishTime' | 'periodFrom' | 'periodTo'
type ReleaseDateValidations = Partial<Record<ReleaseDateField, DateValidationT>>

type SelectedDayStatus = {
  dateKey: string
  status?: keyof typeof DayStatus
}

function isDateField(field: ReleaseFormField): field is ReleaseDateField {
  return field === 'publishTime' || field === 'periodFrom' || field === 'periodTo'
}

function getInvalidDateError(field: ReleaseDateField): string {
  if (field === 'publishTime') {
    return 'Opprett en gyldig publiseringsdato'
  }

  if (field === 'periodFrom') {
    return 'Opprett en gyldig fra-dato'
  }

  return 'Opprett en gyldig til-dato'
}

function parseDateFromString(dateString: string | undefined): Date | undefined {
  return dateString ? new Date(dateString) : undefined
}

function getReleaseModalTitle(isEditing: boolean, isAdmin: boolean) {
  if (!isEditing) return 'Publiseringsdato er registrert'

  return isAdmin ? 'Endringene er lagret og godkjent' : 'Endringer må godkjennes'
}

function getReleaseModalDescription(isEditing: boolean, updatedRelease: ReleaseDetails, isAdmin: boolean) {
  if (!isEditing) return getCreatedReleaseModalDescription(updatedRelease)

  return isAdmin ? 'Endringene er lagret og godkjent.' : 'Endringer på meldt dato må godkjennes på nytt.'
}

function getCreatedReleaseModalDescription(createdRelease: ReleaseDetails) {
  const createdReleaseVariant = formatVariant(createdRelease?.variant).toLowerCase()
  return `Datoen ${formatDate(createdRelease?.publish_time)} er nå sendt inn for ${createdReleaseVariant}.`
}

function getSelectedDateStatus(
  publishTime: Date | undefined,
  calendarDates: CalenderDate,
  selectedDayStatus?: SelectedDayStatus
) {
  if (!publishTime) return undefined

  const dateKey = getDateOnlyAsString(publishTime)

  if (selectedDayStatus?.dateKey === dateKey) {
    return selectedDayStatus.status
  }

  return calendarDates?.[dateKey]?.status as keyof typeof DayStatus | undefined
}

function DateReleasesTable({
  selectedDate,
  selectedDateStatus,
  apiErrorEmit,
}: Readonly<{
  selectedDate?: Date
  selectedDateStatus?: keyof typeof DayStatus
  apiErrorEmit?: (message: string) => void
}>) {
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [sortBy, setSortBy] = useState<string>('-publish_time')

  useEffect(() => {
    async function fetchReleases() {
      const { data, error } = await client.GET('/releases', {
        params: {
          query: { start: 0, count: 100, sort: sortBy, ...getPublishTimeFilterForDate(selectedDate) },
        },
      })
      if (error) {
        apiErrorEmit?.(`Date releases table error: ${error.message}`)
        return
      }
      setReleases(data.releases ?? [])
    }
    fetchReleases()
  }, [sortBy, selectedDate, apiErrorEmit])

  return (
    <>
      <div className='description-wrapper'>
        <span>Innmeldte datoer den {formatDate(selectedDate?.toISOString())}</span>
        <DayStatusTag status={selectedDateStatus || 'NONE'} />
      </div>
      <ReleasesTable releases={releases} sortBy={sortBy} setSortBy={setSortBy} openInNewTab />
    </>
  )
}

function VariantReleasesTable({
  shortname,
  variantId,
  apiErrorEmit,
  latestReleaseEmit,
}: Readonly<{
  shortname: string
  variantId: number
  apiErrorEmit?: (message: string) => void
  latestReleaseEmit?: (release: ReleaseListing | undefined) => void
}>) {
  const [count, setCount] = useState(10)
  const [start, setStart] = useState(0)
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState<string>('-publish_time')

  useEffect(() => {
    async function fetchVariantReleases() {
      const { data, error } = await client.GET('/statistics/{shortname}/variants/{id}/releases', {
        params: { path: { shortname, id: variantId }, query: { start, count, sort: sortBy } },
      })
      if (error) {
        apiErrorEmit?.(`Variant releases table error: ${error.message}`)
        return
      }
      setReleases(data.releases ?? [])
      setTotal(data.total ?? 0)
      latestReleaseEmit?.(data.releases?.[0] ?? undefined)
    }

    fetchVariantReleases()
  }, [shortname, variantId, count, start, sortBy, apiErrorEmit, latestReleaseEmit])

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
        openInNewTab
      />
    </>
  )
}

function useDatepicker(
  key: ReleaseDateField,
  values: ReleaseFormTypes,
  setValues: React.Dispatch<React.SetStateAction<ReleaseFormTypes>>,
  setDateValidations: React.Dispatch<React.SetStateAction<ReleaseDateValidations>>,
  updateFieldErrors: (fields: ReleaseFormField[], nextValues: ReleaseFormTypes, shouldAddNewErrors?: boolean) => void,
  relatedFields: ReleaseFormField[] = [key]
) {
  return useAkselDatePicker({
    onDateChange: (date) => {
      const nextValues = { ...values, [key]: date }

      setValues(nextValues)
      updateFieldErrors(relatedFields, nextValues, false)
    },
    onValidate: (validation) => {
      setDateValidations((currentValidations) => ({
        ...currentValidations,
        [key]: validation,
      }))
    },
  })
}

const inThreeMonths = new Date(new Date().setMonth(new Date().getMonth() + 3))

export default function ReleaseForm() {
  // for creation, path is /statistikk/:shortname/:variantId/opprett
  // for editing, path is /publisering/:id/rediger
  const { id: releaseId, shortname, variantId } = useParams()

  const isEditing = !!releaseId
  const [suggestedPublishTime] = useState(inThreeMonths)
  const [values, setValues] = useState<ReleaseFormTypes>({
    publishTime: suggestedPublishTime,
  })
  const [errors, setErrors] = useState<ReleaseFormErrors>({})
  const [dateValidations, setDateValidations] = useState<ReleaseDateValidations>({})
  const [statistic, setStatistic] = useState<Statistic>()
  const [variant, setVariant] = useState<Variant>()
  const [openReleaseModal, setOpenReleaseModal] = useState(false)
  const [newOrUpdatedRelease, setNewOrUpdatedRelease] = useState<ReleaseDetails>({})
  const [calendarDates, setCalendarDates] = useState<CalenderDate>({})
  const [selectedPublishDayStatus, setSelectedPublishDayStatus] = useState<SelectedDayStatus>()
  const [apiError, setApiError] = useState<string[]>([])
  const [calendarApiError, setCalendarApiError] = useState<string>('')
  const [variantReleasesApiError, setVariantReleasesApiError] = useState<string>('')
  const [sameDateReleasesApiError, setSameDateReleasesApiError] = useState<string>('')
  const [approvalStatus, setApprovalStatus] = useState<string>(ApprovalStatus.PENDING)

  const hasSuggestedReleaseRef = useRef(false)

  const { auth } = useAuth()
  const isAdmin = auth?.isAdmin ?? false

  let submitButtonText = 'Meld dato'
  if (isEditing) {
    submitButtonText = 'Lagre og godkjenn'

    if (!isAdmin) {
      submitButtonText = 'Send endringsforslag'
    }
  }

  const selectedDateStatus = getSelectedDateStatus(values.publishTime, calendarDates, selectedPublishDayStatus)

  function validateField(field: ReleaseFormField, nextValues = values, nextDateValidations = dateValidations): string {
    const nextSelectedDateStatus = getSelectedDateStatus(
      nextValues.publishTime,
      calendarDates,
      selectedPublishDayStatus
    )

    if (isDateField(field) && nextDateValidations[field]?.isInvalid) {
      return getInvalidDateError(field)
    }

    if (field === 'dateType' && !nextValues.dateType) {
      return 'Velg en datotype for publisering'
    }

    if (field === 'publishTime') {
      if (!nextValues.publishTime) {
        return 'Opprett en gyldig publiseringsdato'
      }
      if (!isAdmin && nextValues.publishTime < inThreeMonths) {
        return 'Publiseringsdato tidligere enn tre måneder fra dags dato må opprettes av desken'
      }
      if (!isAdmin && nextSelectedDateStatus === 'FULL') {
        return 'Velg en annen dato som ikke er full, eller kontakt desken@ssb.no'
      }
      if (!isAdmin && nextSelectedDateStatus === 'BLOCKED') {
        return 'Velg en annen dato som ikke er sperret, eller kontakt desken@ssb.no'
      }
    }

    if (field === 'periodFrom') {
      if (!nextValues.periodFrom) {
        return 'Opprett en gyldig fra-dato'
      }
      if (nextValues.periodTo && nextValues.periodFrom > nextValues.periodTo) {
        return 'Fra-dato kan ikke være etter til-dato'
      }
    }

    if (field === 'periodTo') {
      if (!nextValues.periodTo) {
        return 'Opprett en gyldig til-dato'
      }
      if (nextValues.periodFrom && nextValues.periodFrom > nextValues.periodTo) {
        return 'Til-dato kan ikke være før fra-dato'
      }
    }

    if (field === 'comment' && isEditing && !nextValues.comment) {
      return 'Beskriv endringer som er gjort'
    }

    return ''
  }

  function updateFieldErrors(fields: ReleaseFormField[], nextValues: ReleaseFormTypes, shouldAddNewErrors = true) {
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }

      for (const field of fields) {
        const error = validateField(field, nextValues)
        const isPeriodComparisonError =
          (field === 'periodFrom' || field === 'periodTo') &&
          nextValues.periodFrom &&
          nextValues.periodTo &&
          nextValues.periodFrom > nextValues.periodTo

        if (error) {
          if (shouldAddNewErrors || nextErrors[field] || isPeriodComparisonError) {
            nextErrors[field] = error
          }
        } else {
          delete nextErrors[field]
        }
      }

      return nextErrors
    })
  }

  function handleValueChange<K extends ReleaseFormField>(
    field: K,
    value: ReleaseFormTypes[K],
    relatedFields: ReleaseFormField[] = [field],
    shouldAddNewErrors = false
  ) {
    const nextValues = { ...values, [field]: value }

    setValues(nextValues)
    if (field === 'publishTime') {
      setSelectedPublishDayStatus(undefined)
    }
    updateFieldErrors(relatedFields, nextValues, shouldAddNewErrors)
  }

  function handleOnBlur(field: ReleaseFormField) {
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }
      const error = validateField(field)

      if (error) nextErrors[field] = error
      else delete nextErrors[field]

      return nextErrors
    })
  }

  const periodFields: ReleaseFormField[] = ['periodFrom', 'periodTo']
  const publishTimePicker = useDatepicker('publishTime', values, setValues, setDateValidations, updateFieldErrors)
  const periodFromPicker = useDatepicker(
    'periodFrom',
    values,
    setValues,
    setDateValidations,
    updateFieldErrors,
    periodFields
  )
  const periodToPicker = useDatepicker(
    'periodTo',
    values,
    setValues,
    setDateValidations,
    updateFieldErrors,
    periodFields
  )

  function getDisplayedError(field: ReleaseFormField) {
    return errors[field] ?? ''
  }

  const displayedErrors: ReleaseFormErrors = {
    dateType: getDisplayedError('dateType'),
    publishTime: getDisplayedError('publishTime'),
    periodFrom: getDisplayedError('periodFrom'),
    periodTo: getDisplayedError('periodTo'),
    comment: getDisplayedError('comment'),
  }

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

      setApprovalStatus(response?.approval_status ?? ApprovalStatus.PENDING)
      setSelectedPublishDayStatus(undefined)
      setDateValidations({})
      setValues(loaded)
      publishTimePicker.setSelected(loaded.publishTime)
      periodFromPicker.setSelected(loaded.periodFrom)
      periodToPicker.setSelected(loaded.periodTo)
      setStatistic(response?.statistic)
      setVariant(response?.variant)
    }

    setPrefilledValues()
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [releaseId])

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

  function handleLatestReleaseEmit(latestRelease: ReleaseListing | undefined) {
    if (isEditing || hasSuggestedReleaseRef.current) return
    hasSuggestedReleaseRef.current = true

    const suggestedRelease = suggestNextRelease(latestRelease)
    if (!suggestedRelease) return

    setValues((v) => ({
      ...v,
      publishTime: suggestedRelease.publishTime,
      periodFrom: suggestedRelease.periodFrom,
      periodTo: suggestedRelease.periodTo,
    }))
    updateFieldErrors(
      ['publishTime', 'periodFrom', 'periodTo'],
      {
        ...values,
        publishTime: suggestedRelease.publishTime,
        periodFrom: suggestedRelease.periodFrom,
        periodTo: suggestedRelease.periodTo,
      },
      false
    )
    setSelectedPublishDayStatus(undefined)
    setDateValidations({})
    publishTimePicker.setSelected(suggestedRelease.publishTime)
    periodFromPicker.setSelected(suggestedRelease.periodFrom)
    periodToPicker.setSelected(suggestedRelease.periodTo)
  }

  function validateFields(): boolean {
    const nextErrors: ReleaseFormErrors = {}

    const fieldsToValidate: ReleaseFormField[] = ['dateType', 'publishTime', 'periodFrom', 'periodTo']
    if (isEditing) {
      fieldsToValidate.push('comment')
    }

    for (const field of fieldsToValidate) {
      const error = validateField(field)
      if (error) {
        nextErrors[field] = error
      }
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
      setApiError((prev) => [...prev, error.message])
      return
    }
    setOpenReleaseModal(true)
    setNewOrUpdatedRelease(data)
  }

  async function createRelease(body: ReleaseCreate) {
    const { data, error } = await client.POST('/statistics/{shortname}/variants/{id}/releases', {
      params: { path: { shortname: shortname as string, id: Number(variantId) } },
      body,
    })

    if (error) {
      setApiError((prev) => [...prev, error.message])
      return
    }
    setOpenReleaseModal(true)
    setNewOrUpdatedRelease(data)
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

  const errorsCombined = [...apiError, calendarApiError, sameDateReleasesApiError, variantReleasesApiError].filter(
    Boolean
  )

  const showEarlyPublishTimeWarning = isAdmin && values.publishTime && values.publishTime < inThreeMonths
  const showFullPublishDateWarning = isAdmin && selectedDateStatus === 'FULL'
  const showBlockedPublishDateWarning = isAdmin && selectedDateStatus === 'BLOCKED'

  return (
    <>
      {errorsCombined.length > 0 && <ErrorAlert message={errorsCombined} />}
      <div>
        <Heading level={1} data-size='md'>
          {isEditing ? 'Rediger publiseringsdato' : 'Meld publiseringsdato'}
        </Heading>
        <Heading data-size='xs' level={2}>
          {statistic?.name} ({statistic?.shortname}) og {variant?.frequency?.name?.toLowerCase()}
        </Heading>
        <ApprovalStatusTag status={approvalStatus} />
      </div>

      <form onSubmit={handleOnSubmit} className='release-form'>
        <Field>
          <Paragraph className='release-form-description'>Alle felter må fylles ut</Paragraph>
          <Label>Datotype for publisering</Label>
          <Select
            id='dateType'
            value={values.dateType ?? ''}
            onChange={(e) => handleValueChange('dateType', e.target.value)}
            onBlur={() => handleOnBlur('dateType')}
            aria-invalid={!!displayedErrors.dateType}
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
          {displayedErrors.dateType && <ValidationMessage>{displayedErrors.dateType}</ValidationMessage>}
        </Field>

        <Field>
          <Label>Publiseringsdato</Label>
          <Field.Description>
            Nye datoer og endringer må meldes minst 3 måneder i forveien. <br />
            For kortere frister, kontakt mmj@ssb.no.
          </Field.Description>
          <Input
            id='publishTime'
            size={10}
            {...publishTimePicker.inputProps}
            onChange={publishTimePicker.inputProps.onChange}
            onBlur={(e) => {
              publishTimePicker.inputProps.onBlur?.(e)
              handleOnBlur('publishTime')
            }}
            aria-invalid={!!displayedErrors.publishTime}
          />
          {displayedErrors.publishTime && <ValidationMessage>{displayedErrors.publishTime}</ValidationMessage>}
          {showEarlyPublishTimeWarning && (
            <ValidationMessage data-color='warning'>
              Du har valgt en dato tidligere enn tre måneder fra i dag. Du kan fortsatt melde dato som admin.
            </ValidationMessage>
          )}
          {showFullPublishDateWarning && (
            <ValidationMessage data-color='warning'>
              Denne dagen er allerede full. Du kan fortsatt melde dato som admin.
            </ValidationMessage>
          )}
          {showBlockedPublishDateWarning && (
            <ValidationMessage data-color='warning'>
              Denne dagen er sperret. Du kan fortsatt melde dato som admin.
            </ValidationMessage>
          )}
          <DatePicker
            {...publishTimePicker.datepickerProps}
            showColorCodingExplanation
            calendarDatesEmit={setCalendarDates}
            apiErrorEmit={setCalendarApiError}
            onDaySelect={(date, status) => {
              setSelectedPublishDayStatus(date ? { dateKey: getDateOnlyAsString(date), status } : undefined)
            }}
          />
        </Field>

        <Fieldset>
          <div className='release-form-period-fieldset-wrapper'>
            <Field>
              <Label>Måleperiode fra</Label>
              <AkselDatePicker {...periodFromPicker.datepickerProps}>
                <AkselDatePicker.Input
                  id='periodFrom'
                  {...periodFromPicker.inputProps}
                  onChange={periodFromPicker.inputProps.onChange}
                  onBlur={(e) => {
                    periodFromPicker.inputProps.onBlur?.(e)
                    handleOnBlur('periodFrom')
                  }}
                  aria-invalid={!!displayedErrors.periodFrom}
                  label
                />
              </AkselDatePicker>
              {displayedErrors.periodFrom && <ValidationMessage>{displayedErrors.periodFrom}</ValidationMessage>}
            </Field>

            <Field>
              <Label>Måleperiode til</Label>
              <AkselDatePicker {...periodToPicker.datepickerProps}>
                <AkselDatePicker.Input
                  id='periodTo'
                  {...periodToPicker.inputProps}
                  onChange={periodToPicker.inputProps.onChange}
                  onBlur={(e) => {
                    periodToPicker.inputProps.onBlur?.(e)
                    handleOnBlur('periodTo')
                  }}
                  aria-invalid={!!displayedErrors.periodTo}
                  label
                />
              </AkselDatePicker>
              {displayedErrors.periodTo && <ValidationMessage>{displayedErrors.periodTo}</ValidationMessage>}
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
              onChange={(e) => handleValueChange('comment', e.target.value)}
              onBlur={() => handleOnBlur('comment')}
            />
            {displayedErrors.comment && <ValidationMessage>{displayedErrors.comment}</ValidationMessage>}
          </Field>
        )}

        <div className='release-form-button-wrapper'>
          <Button type='submit'>{submitButtonText}</Button>
          <Button variant='tertiary' asChild>
            <ReactRouterLink
              to={isEditing ? `/publisering/${releaseId}` : `/statistikk/${statistic?.shortname}`}
              reloadDocument
            >
              Avbryt
            </ReactRouterLink>
          </Button>
        </div>

        {Object.values(displayedErrors).some(Boolean) && (
          <ErrorSummary>
            <ErrorSummary.Heading>For å gå videre må du rette opp følgende feil:</ErrorSummary.Heading>
            <ErrorSummary.List>
              {Object.entries(displayedErrors).map(([key, message]) => {
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
        modalHeading={getReleaseModalTitle(isEditing, isAdmin)}
        modalDescription={getReleaseModalDescription(isEditing, newOrUpdatedRelease, isAdmin)}
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
          <DateReleasesTable
            selectedDate={values.publishTime}
            selectedDateStatus={selectedDateStatus}
            apiErrorEmit={setSameDateReleasesApiError}
          />
        </Tabs.Panel>
        <Tabs.Panel className='p-0' value='variant-releases'>
          {statistic && variant && (
            <VariantReleasesTable
              shortname={statistic.shortname as string}
              variantId={variant.id as number}
              apiErrorEmit={setVariantReleasesApiError}
              latestReleaseEmit={handleLatestReleaseEmit}
            />
          )}
        </Tabs.Panel>
      </Tabs>
    </>
  )
}
