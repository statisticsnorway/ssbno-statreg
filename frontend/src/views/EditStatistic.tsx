import { useNavigate, useParams } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useDeferredValue, useMemo, type SetStateAction } from 'react'
import {
  Heading,
  Popover,
  Paragraph,
  Divider,
  Field,
  Fieldset,
  Checkbox,
  Label,
  Select,
  Input,
  Button,
  useCheckboxGroup,
  ValidationMessage,
  Tag,
  ErrorSummary,
  Textarea,
  Link,
  Card,
  Spinner,
  EXPERIMENTAL_Suggestion as Suggestion,
  type SuggestionItem,
} from '@statisticsnorway/design-react'
import { QuestionmarkCircleIcon, PlusCircleIcon, PencilWritingIcon } from '@navikt/aksel-icons'

import client from '../api'

import './CreateStatistic.css'

import {
  RequiredEditStatisticFieldsByStatus,
  ApprovalStatus,
  StatisticStatus,
  RevisionNames,
} from '@ssbno-statreg/shared'
import type {
  EditableStatisticStatus,
  Contact,
  Division,
  Variant,
  Shortname,
  StatisticDetails,
  StatisticListing,
  StatisticUpdate,
} from '@ssbno-statreg/shared'
import ErrorPage, { ErrorType } from './ErrorPage'
import { ErrorAlert } from '../components/ErrorAlert'
import { DivisionSelection } from '../components/DivisionSelection'
import { VariantModal, useVariantModal } from '../components/VariantModal'
import { ContactSelection } from '../components/ContactSelection'
import type { StatisticFormErrors, StatisticFormField, StatisticPartialFormValues } from './CreateStatistic'

type StatisticFormValues = {
  status: keyof typeof StatisticStatus | ''
  values: StatisticPartialFormValues
  selectedContacts: string[]
  createdVariants: Variant[]
}

function isEditStatisticFieldRequired(status: EditableStatisticStatus, field: StatisticFormField): boolean {
  return RequiredEditStatisticFieldsByStatus[status]?.includes(field) ?? false
}

export default function EditStatistic() {
  const variantDialogId = 'edit-statistic-variant-dialog'
  const { shortname } = useParams<Shortname['shortname']>()

  const [statistic, setStatistic] = useState<StatisticDetails>({})
  const [divisions, setDivisions] = useState<Division[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [relationStatistics, setRelationStatistics] = useState<StatisticListing[]>([])
  const [selectedRelation, setSelectedRelation] = useState<SuggestionItem | null>(null)
  const [relationError, setRelationError] = useState('')
  const [relationOptionsStatus, setRelationOptionsStatus] = useState<'idle' | 'loading' | 'loaded'>('idle')

  const [createdVariants, setCreatedVariants] = useState<Variant[]>([])
  const {
    editVariantIndex,
    addVariantButtonRef,
    variantModalCloseCount,
    handleOpenCreateVariantModal,
    handleOpenEditVariantModal,
    handleVariantModalActionClose,
    handleVariantModalClose,
  } = useVariantModal()

  const {
    getCheckboxProps,
    value: regionLevelValues,
    setValue: setRegionLevelValues,
  } = useCheckboxGroup({
    name: 'region-level-checkbox',
    value: [],
  })

  const defaultValues: StatisticPartialFormValues = {
    name: '',
    name_en: '',
    division: '',
    main_language: 'nb',
    first_released_at: '',
    comment: '',
  }

  const [status, setStatus] = useState<EditableStatisticStatus | ''>('')
  const [values, setValues] = useState<StatisticPartialFormValues>(defaultValues)
  const [errors, setErrors] = useState<StatisticFormErrors>({})
  const [apiError, setApiError] = useState<string[]>([])
  const deferredRelationStatistics = useDeferredValue(relationStatistics, [])
  const relationOptions = useMemo(
    () =>
      deferredRelationStatistics.map((item) => (
        <Suggestion.Option key={item.id} label={item.shortname} value={item.id!.toString()}>
          {item.shortname}
          {item.name && <div>{item.name}</div>}
        </Suggestion.Option>
      )),
    [deferredRelationStatistics]
  )
  const fieldsToValidate: StatisticFormField[] = [
    ...Object.keys(defaultValues),
    'variants',
    'contacts',
  ] as StatisticFormField[]

  const regionLevelCheckboxData = [
    {
      name: 'Bydel og krets',
      code: 'BD',
    },
    {
      name: 'Kommune',
      code: 'K',
    },
    {
      name: 'Fylke',
      code: 'F',
    },
    {
      name: 'Landsdel',
      code: 'LD',
    },
    {
      name: 'Land',
      code: 'L',
    },
  ]

  const { auth } = useAuth()
  const isAdmin = auth?.isAdmin ?? false

  const navigate = useNavigate()

  async function fetchDivisions() {
    const { data, error } = await client.GET('/divisions')

    if (error) {
      setApiError((prev) => [...prev, error.message])
      return
    }

    setDivisions((Object.values(data) as Division[]) ?? [])
  }

  async function fetchContacts() {
    const { data, error } = await client.GET('/contacts')

    if (error) {
      setApiError((prev) => [...prev, error.message])
      return
    }

    setContacts(data ?? [])
  }

  useEffect(() => {
    if (!shortname || !isAdmin) return

    async function initializeUpdateStatistic() {
      setApiError([])

      const { data, error } = await client.GET('/statistics/{shortname}', {
        params: { path: { shortname: shortname as string } },
      })

      if (error) {
        setApiError((prev) => [...prev, error.message])
        return
      }

      const nextStatistic = data as StatisticDetails
      const division =
        typeof nextStatistic.division === 'string' ? nextStatistic.division : nextStatistic.division?.code

      setStatistic(nextStatistic)
      setSelectedContacts(nextStatistic.contacts?.map((contact) => contact.principalName) ?? [])
      setSelectedRelation(
        typeof nextStatistic.relation?.id === 'number' && nextStatistic.relation.shortname
          ? {
              label: nextStatistic.relation.shortname,
              value: nextStatistic.relation.id.toString(),
            }
          : null
      )
      setStatus((nextStatistic.status?.code as EditableStatisticStatus) ?? '')
      setValues({
        name: nextStatistic.name ?? '',
        name_en: nextStatistic.name_en ?? '',
        division: division ?? '',
        main_language: nextStatistic.main_language ?? 'nb',
        first_released_at: nextStatistic.first_released_at?.slice(0, 4) ?? '',
        comment: nextStatistic.comment ?? '',
      })
      setCreatedVariants(nextStatistic.variants ?? [])
      setRegionLevelValues(
        nextStatistic.statistic_region_levels?.flatMap((regionLevel) => (regionLevel.code ? [regionLevel.code] : [])) ??
        []
      )
      setErrors({})
      setRelationError('')

      await Promise.all([fetchDivisions(), fetchContacts()])
    }

    initializeUpdateStatistic()
  }, [isAdmin, setRegionLevelValues, shortname])

  useEffect(() => {
    if (!shortname || !isAdmin || relationOptionsStatus !== 'loading') return

    async function fetchRelationStatistics() {
      const { data, error } = await client.GET('/statistics', {
        params: { query: { start: 0, count: 1000, sort: 'shortname' } },
      })

      if (error) {
        setApiError((prev) => [...prev, error.message])
        setRelationOptionsStatus('loaded')
        return
      }

      setRelationStatistics(
        (data.statistics ?? []).filter(
          (item) => typeof item.id === 'number' && item.shortname !== shortname
        )
      )
      setRelationOptionsStatus('loaded')
    }

    fetchRelationStatistics()
  }, [isAdmin, relationOptionsStatus, shortname])

  function isRequired(field: StatisticFormField) {
    if (!status) return false
    return isEditStatisticFieldRequired(status, field) || field === 'comment'
  }

  function nextInputValues(
    nextValues = values,
    nextStatus = status,
    nextSelectedContacts = selectedContacts,
    nextCreatedVariants = createdVariants
  ): StatisticFormValues {
    return {
      status: nextStatus,
      values: nextValues,
      selectedContacts: nextSelectedContacts,
      createdVariants: nextCreatedVariants,
    }
  }

  function validateField(field: StatisticFormField, validatedInput: StatisticFormValues): string {
    if (field === 'comment' && !validatedInput.values.comment) return 'Fyll inn kommentar'

    // Optional field validation
    if (
      field === 'first_released_at' &&
      validatedInput.values.first_released_at &&
      !/^\d{4}$/.test(validatedInput.values.first_released_at)
    ) {
      return 'Statistikkens startår må være et gyldig år med fire siffer'
    }

    if (!validatedInput.status || !isEditStatisticFieldRequired(validatedInput.status, field)) {
      return ''
    }

    if (field === 'name' && !validatedInput.values.name) return 'Fyll inn norsk statistikknavn'
    if (field === 'name_en' && !validatedInput.values.name_en) return 'Fyll inn engelsk statistikknavn'
    if (field === 'division' && !validatedInput.values.division) return 'Velg ansvarlig seksjon for statistikken'
    if (field === 'contacts' && validatedInput.selectedContacts.length === 0) return 'Legg til minst én kontakt'

    const activeVariants = validatedInput.createdVariants.filter((variant) => !variant.cancelled).length
    if (field === 'variants' && activeVariants === 0) {
      return 'Legg til minst én variant'
    }

    return ''
  }

  function validateForm(validateInput = nextInputValues()): StatisticFormErrors {
    const nextErrors: StatisticFormErrors = {}
    for (const field of fieldsToValidate) {
      const error = validateField(field, validateInput)

      if (error) {
        nextErrors[field] = error
      }
    }

    return nextErrors
  }

  function handleValueChange<K extends keyof StatisticPartialFormValues>(
    field: K,
    value: StatisticPartialFormValues[K]
  ) {
    const nextValues = { ...values, [field]: value }

    setValues(nextValues)
    setErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors
      }

      const nextErrors = { ...currentErrors }
      delete nextErrors[field]
      return nextErrors
    })
  }

  function handleStatusChange(nextStatus: EditableStatisticStatus) {
    const validateInput = nextInputValues(values, nextStatus)

    setStatus(nextStatus)
    if (nextStatus !== 'SA') setRelationError('')
    setErrors((currentErrors) => {
      const nextErrors = validateForm(validateInput)

      return Object.fromEntries(
        Object.entries(nextErrors).filter(([field]) => currentErrors[field as StatisticFormField])
      )
    })
  }

  function handleRelationChange(nextRelation: SuggestionItem | null) {
    setSelectedRelation(nextRelation)
    if (nextRelation) setRelationError('')
  }

  function handleVariantsChange(nextCreatedVariants: SetStateAction<Variant[]>) {
    const resolvedVariants =
      typeof nextCreatedVariants === 'function' ? nextCreatedVariants(createdVariants) : nextCreatedVariants
    const validateInput = nextInputValues(values, status, selectedContacts, resolvedVariants)

    setCreatedVariants(resolvedVariants)
    setErrors((currentErrors) => {
      if (!currentErrors.variants) {
        return currentErrors
      }

      const error = validateField('variants', validateInput)
      if (error) return { ...currentErrors, variants: error }

      const nextErrors = { ...currentErrors }
      delete nextErrors.variants
      return nextErrors
    })
  }

  function handleContactsChange(nextSelectedContacts: string[]) {
    const validateInput = nextInputValues(values, status, nextSelectedContacts)

    setSelectedContacts(nextSelectedContacts)
    setErrors((currentErrors) => {
      if (!currentErrors.contacts) return currentErrors

      const error = validateField('contacts', validateInput)
      if (error) return { ...currentErrors, contacts: error }

      const nextErrors = { ...currentErrors }
      delete nextErrors.contacts
      return nextErrors
    })
  }

  async function updateStatistic() {
    const body: StatisticUpdate = {
      ...values,
      status: { code: status },
      first_released_at: values.first_released_at ? `${values.first_released_at}-12-31` : undefined,
      statistic_region_levels: regionLevelValues.map((code: string) => ({ code })),
      approval_status: ApprovalStatus['ACCEPTED'],
      // Retain fields from the original statistic that are not part of the form
      relation_id: status === 'SA' && selectedRelation ? Number(selectedRelation.value) : null,
      yearly_reporting: statistic.yearly_reporting,
      previous_topic_codes: statistic.previous_topic_codes,
      variants: createdVariants,
      contacts: selectedContacts,
    }

    const { data, error } = await client.PUT(`/statistics/{shortname}`, {
      params: { path: { shortname: shortname as string } },
      body,
    })

    if (error) {
      console.error('Error updating statistic:', error)
      setApiError((prev) => [...prev, error.message])
      return
    }

    navigate(`/statistikk/${data.shortname}`)
  }

  function handleSubmit(e: React.ChangeEvent<HTMLFormElement>) {
    e.preventDefault()

    const nextErrors = validateForm()
    const nextRelationError = status === 'SA' && !selectedRelation ? 'Velg statistikken denne videreføres av' : ''

    setErrors(nextErrors)
    setRelationError(nextRelationError)
    setApiError([])

    if (Object.keys(nextErrors).length || nextRelationError) return

    updateStatistic()
  }

  function getFieldLabel(label: string, field: StatisticFormField) {
    if (isRequired(field)) {
      return (
        <div>
          {label} <Tag data-color='warning'>Må fylles ut</Tag>
        </div>
      )
    }

    return label
  }

  if (!auth?.isAdmin) return <ErrorPage type={ErrorType.NOTAUTH} />

  return (
    <div className='create-statistic-container'>
      <VariantModal
        key={[variantModalCloseCount, editVariantIndex ?? 'create'].join('-')}
        dialogId={variantDialogId}
        setCreatedVariants={handleVariantsChange}
        editVariantIndex={editVariantIndex}
        editVariantValues={editVariantIndex !== null ? createdVariants[editVariantIndex] : undefined}
        onActionClose={handleVariantModalActionClose}
        onAfterClose={handleVariantModalClose}
      />
      {apiError.length > 0 && <ErrorAlert message={apiError} />}
      <Heading level={1} data-size='md' className='create-statistic-heading'>
        Rediger statistikk
      </Heading>
      <form className='create-statistic-form' onSubmit={handleSubmit}>
        <Field>
          <div className='create-statistic-form-status-label'>
            <Label data-size='lg'>Status</Label>
            <Popover.TriggerContext>
              <Popover.Trigger variant='tertiary'>
                <QuestionmarkCircleIcon fontSize={24} />
              </Popover.Trigger>
              <Popover placement='right' data-color='info'>
                <ul>
                  <li>
                    Statistikker som har blitt opprettet med status «Aktiv», kan ikke bli gjort om til «Kommende» igjen.
                  </li>
                  <li>
                    For å slette en statistikk som har blitt feilopprettet må du ta kontakt med{' '}
                    <Link href='mailto:desken@ssb.no'>desken@ssb.no</Link>
                  </li>
                  <li>
                    Velg status «Ikke-aktiv» når statistikken er satt på pause på ubestemt tid, og du vil beholde
                    mulighet til åpne den igjen i fremtiden uten å måtte opprette den på nytt.
                  </li>
                  <li>
                    Velg status «Opphørt» når statistikken er endelig avsluttet og det er bestemt at det aldri skal
                    publiseres flere tall.
                  </li>
                </ul>
              </Popover>
            </Popover.TriggerContext>
          </div>
          <Field.Description>
            Statistikker som er nyopprettet får status «Kommende». For å sette den til «Aktiv» må du i tillegg fylle ut:
            Engelsk navn, varianter og kontakter.
          </Field.Description>
          <Select
            width='auto'
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as EditableStatisticStatus)}
          >
            {Object.entries(StatisticStatus).map(([code, name]) => (
              <Select.Option
                key={`${code}-${name}`}
                value={code}
                disabled={statistic.status?.code !== code && code !== 'A' && code !== 'SA'}
              >
                {name}
              </Select.Option>
            ))}
          </Select>
        </Field>

        {status === 'SA' && (
          <Field>
            <Label>
              <div>
                Videreføres av <Tag data-color='warning'>Må fylles ut</Tag>
              </div>
            </Label>
            <Field.Description>Søk på kortnavn.</Field.Description>
            <Suggestion selected={selectedRelation} onSelectedChange={handleRelationChange}>
              <Suggestion.Input
                id='relation_id'
                aria-invalid={!!relationError}
                onFocus={() => setRelationOptionsStatus((current) => (current === 'idle' ? 'loading' : current))}
              />
              <Suggestion.Clear aria-label='Tøm valgt statistikk' onClick={() => handleRelationChange(null)} />
              <Suggestion.List>
                {relationOptionsStatus !== 'loaded' ? (
                  <li aria-live='polite'>
                    <Spinner aria-label='Laster' data-size='sm' /> Laster...
                  </li>
                ) : (
                  <>
                    <Suggestion.Empty>Ingen treff</Suggestion.Empty>
                    {relationOptions}
                  </>
                )}
              </Suggestion.List>
            </Suggestion>
            {relationError && <ValidationMessage>{relationError}</ValidationMessage>}
          </Field>
        )}

        <Divider />
        <Field>
          <Label>Kortnavn</Label>
          <Field.Description>Kortnavnet kan ikke endres etter statistikken har blitt opprettet.</Field.Description>
          <Input readOnly value={shortname} />
        </Field>
        <Field>
          <Label>{getFieldLabel('Norsk statistikknavn', 'name')}</Label>
          <Input
            id='name'
            aria-invalid={!!errors.name}
            value={values.name}
            onChange={(e) => handleValueChange('name', e.target.value)}
          />
          {errors.name && <ValidationMessage>{errors.name}</ValidationMessage>}
        </Field>
        <Field>
          <Label>{getFieldLabel('Engelsk statistikknavn', 'name_en')}</Label>
          <Input
            id='name_en'
            aria-invalid={!!errors.name_en}
            value={values.name_en}
            onChange={(e) => handleValueChange('name_en', e.target.value)}
          />
          {errors.name_en && <ValidationMessage>{errors.name_en}</ValidationMessage>}
        </Field>
        <Divider />
        <div className='created-variants-title-container'>
          <Label>{getFieldLabel('Variant', 'variants')}</Label>
          <Paragraph>Legg til variant for å kunne melde publiseringsdato på statistikken</Paragraph>
        </div>
        {createdVariants.length > 0 && (
          <div className='created-variants-container'>
            {createdVariants.map((variant, index) => {
              if (variant.cancelled) return null
              return (
                <Card
                  key={['created-variant', variant.frequency?.code ?? index, variant.revision?.code ?? index].join('-')}
                  variant='tinted'
                >
                  <Card.Block>
                    <div className='created-variant-heading-container'>
                      <Heading>
                        {[
                          variant.frequency!.name,
                          RevisionNames[variant.revision!.code as keyof typeof RevisionNames].toLocaleLowerCase(),
                        ].join(', ')}
                      </Heading>
                      <Button
                        variant='tertiary'
                        data-color='danger'
                        command='show-modal'
                        commandfor={variantDialogId}
                        onClick={() => handleOpenEditVariantModal(index)}
                      >
                        <PencilWritingIcon /> Rediger
                      </Button>
                    </div>
                    <Paragraph>
                      Detaljnivå: {variant.level_of_detail?.name} <br />
                      Engelsk detaljnivå: {variant.level_of_detail?.name_en}
                    </Paragraph>
                  </Card.Block>
                </Card>
              )
            })}
          </div>
        )}
        <div className='create-variant-button-container'>
          <Button
            id='variants'
            ref={addVariantButtonRef}
            variant='secondary'
            aria-invalid={!!errors.variants}
            command='show-modal'
            commandfor={variantDialogId}
            onClick={handleOpenCreateVariantModal}
          >
            <PlusCircleIcon /> Legg til variant
          </Button>
          {errors.variants && <ValidationMessage>{errors.variants}</ValidationMessage>}
        </div>
        <Divider />
        <div className='contact-section'>
          <Label>{getFieldLabel('Kontakter', 'contacts')}</Label>
          <Paragraph className='contact-section-description'>
            Søk og legg til kontakt. Navn vises under overskriften 'Kontakt' på statistikksiden på ssb.no
          </Paragraph>
          <Field className='contact-field'>
            <ContactSelection
              id='contacts'
              ariaInvalid={!!errors.contacts}
              contacts={contacts}
              selected={selectedContacts}
              setSelected={handleContactsChange}
            />
            {errors.contacts && <ValidationMessage>{errors.contacts}</ValidationMessage>}
          </Field>
        </div>
        <Divider />
        <Heading level={2}>Detaljer</Heading>
        <Field>
          <Label>{getFieldLabel('Seksjon', 'division')}</Label>
          <DivisionSelection
            id='division'
            ariaInvalid={!!errors.division}
            divisions={divisions}
            selected={values.division}
            setSelected={(selected) => handleValueChange('division', selected)}
          />
          {errors.division && <ValidationMessage>{errors.division}</ValidationMessage>}
        </Field>
        <Fieldset>
          <Fieldset.Legend>Regionale nivåer</Fieldset.Legend>
          {regionLevelCheckboxData.map((regionLevel) => (
            <Checkbox
              key={`region-level-checkbox-${regionLevel.code}`}
              label={regionLevel.name}
              {...getCheckboxProps(regionLevel.code)}
            />
          ))}
        </Fieldset>
        <Field>
          <Label>{getFieldLabel('Målform', 'main_language')}</Label>
          <Select
            width='auto'
            value={values.main_language}
            onChange={(e) => handleValueChange('main_language', e.target.value)}
          >
            <Select.Option value='nb'>Bokmål</Select.Option>
            <Select.Option value='nn'>Nynorsk</Select.Option>
          </Select>
        </Field>
        <Field>
          <Label>Statistikkens startår</Label>
          <Field.Description>F.eks 1876</Field.Description>
          <Input
            id='first_released_at'
            maxLength={4}
            size={4}
            aria-invalid={!!errors.first_released_at}
            value={values.first_released_at}
            onChange={(e) => handleValueChange('first_released_at', e.target.value)}
          />
          {errors.first_released_at && <ValidationMessage>{errors.first_released_at}</ValidationMessage>}
        </Field>
        <Divider />
        <Field>
          <Label>{getFieldLabel('Kommentar', 'comment')}</Label>
          <Field.Description>Annen relevant informasjon.</Field.Description>
          <Textarea rows={3} value={values.comment} onChange={(e) => handleValueChange('comment', e.target.value)} />
          {errors.comment && <ValidationMessage>{errors.comment}</ValidationMessage>}
        </Field>
        <div className='create-statistic-form-buttons'>
          <Button type='submit'>Lagre og godkjenn</Button>
          <Button
            type='button'
            variant='tertiary'
            onClick={() => {
              navigate(`/statistikk/${shortname}`)
            }}
          >
            Avbryt
          </Button>
        </div>
        {(Object.values(errors).some(Boolean) || relationError) && (
          <ErrorSummary>
            <ErrorSummary.Heading>For å gå videre må du rette opp følgende feil:</ErrorSummary.Heading>
            <ErrorSummary.List>
              {relationError && (
                <ErrorSummary.Item>
                  <ErrorSummary.Link href='#relation_id'>{relationError}</ErrorSummary.Link>
                </ErrorSummary.Item>
              )}
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
    </div>
  )
}
