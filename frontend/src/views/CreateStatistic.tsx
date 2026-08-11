import { useNavigate, useParams } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import {
  Alert,
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
  Card,
} from '@digdir/designsystemet-react'
import { QuestionmarkCircleIcon, PlusCircleIcon, PencilWritingIcon } from '@navikt/aksel-icons'

import client from '../api'

import './CreateStatistic.css'

import { isCreateStatisticFieldRequired, ApprovalStatus, RevisionNames } from '@ssbno-statreg/shared'
import type { CreatableStatisticStatus, Division, Contact, Variant, Shortname } from '@ssbno-statreg/shared'
import ErrorPage, { ErrorType } from './ErrorPage'
import { ErrorAlert } from '../components/ErrorAlert'
import { CreateShortnameModal } from '../components/CreateShortnameModal'
import { ContactSelection } from '../components/ContactSelection'
import { VariantModal } from '../components/VariantModal'

type StatisticFormValues = {
  status: CreatableStatisticStatus
  name: string
  name_en: string
  division: string
  main_language: string
  first_released_at: string
  comment: string
}

type StatisticFormErrors = Partial<Record<keyof StatisticFormValues, string>>

export default function CreateStatistic() {
  const { shortname } = useParams<Shortname['shortname']>()
  const createdShortname = shortname ?? ''

  const [divisions, setDivisions] = useState<Division[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])

  const [openVariantModal, setOpenVariantModal] = useState<boolean>(false)
  const [createdVariants, setCreatedVariants] = useState<Variant[]>([])
  const [editVariantIndex, setEditVariantIndex] = useState<number | null>(null)

  const { getCheckboxProps, value: regionLevelValues } = useCheckboxGroup({
    name: 'region-level-checkbox',
    value: [],
  })

  const defaultValues: StatisticFormValues = {
    status: 'K',
    name: '',
    name_en: '',
    division: '',
    main_language: 'nb',
    first_released_at: '',
    comment: '',
  }

  const [values, setValues] = useState<StatisticFormValues>(defaultValues)
  const [errors, setErrors] = useState<StatisticFormErrors>({})
  const [apiError, setApiError] = useState<string[]>([])
  const [isRouteValidated, setIsRouteValidated] = useState(false)
  const [hasInvalidShortname, setHasInvalidShortname] = useState(false)

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
    if (!createdShortname || !isAdmin) return

    async function initializeCreateStatistic() {
      setIsRouteValidated(true)
      setHasInvalidShortname(false)
      setApiError([])

      const { data: shortnames, error: shortnamesError } = await client.GET('/shortnames')

      if (shortnamesError) {
        setApiError([shortnamesError.message])
        setIsRouteValidated(false)
        return
      }

      const shortnameExists = shortnames.some(({ shortname }) => shortname === createdShortname)

      if (!shortnameExists) {
        setHasInvalidShortname(true)
        setIsRouteValidated(false)
        return
      }

      const {
        data: existingStatistic,
        error: statisticError,
        response: statisticResponse,
      } = await client.GET(`/statistics/{shortname}`, {
        params: { path: { shortname: createdShortname } },
      })

      if (existingStatistic) {
        navigate(`/statistikk/${createdShortname}`)
        return
      }

      if (statisticError && statisticResponse.status !== 404) {
        setApiError([statisticError.message])
        setIsRouteValidated(false)
        return
      }

      await Promise.all([fetchDivisions(), fetchContacts()])

      setIsRouteValidated(false)
    }

    initializeCreateStatistic()
  }, [createdShortname, isAdmin, navigate])

  function isRequired(field: keyof StatisticFormValues) {
    return isCreateStatisticFieldRequired(values.status, field)
  }

  function validateField(field: keyof StatisticFormValues, nextValues: StatisticFormValues): string {
    if (!isRequired(field) && !nextValues[field]) {
      return ''
    }

    if (field === 'name' && !nextValues.name) return 'Fyll inn norsk statistikknavn'
    if (field === 'division' && !nextValues.division) return 'Velg ansvarlig seksjon for statistikken'

    // Optional fields
    if (field === 'first_released_at' && !/^\d{4}$/.test(nextValues.first_released_at)) {
      return 'Statistikkens startår må være et gyldig år med fire siffer'
    }

    return ''
  }

  function handleOnBlur(field: keyof StatisticFormValues) {
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }
      const error = validateField(field, values)

      if (error) nextErrors[field] = error
      else delete nextErrors[field]

      return nextErrors
    })
  }

  async function createStatistic() {
    const { data, error } = await client.POST(`/statistics/{shortname}`, {
      params: { path: { shortname: createdShortname } },
      body: {
        ...values,
        status: { code: values.status },
        first_released_at: values.first_released_at ? `${values.first_released_at}-12-31` : '',
        statistic_region_levels: regionLevelValues.length
          ? regionLevelValues.map((code: string) => ({
              code,
            }))
          : [],
        approval_status: ApprovalStatus['ACCEPTED'],
        contacts: selectedContacts,
        variants: createdVariants,
      },
    })

    if (error) {
      console.error('Error creating statistic:', error)
      setApiError((prev) => [...prev, error.message])
      return
    }

    navigate(`/statistikk/${data.shortname}`)
  }

  function handleSubmit(e: React.ChangeEvent<HTMLFormElement>) {
    e.preventDefault()

    const nextErrors: StatisticFormErrors = {}

    for (const field of Object.keys(values) as (keyof StatisticFormValues)[]) {
      const error = validateField(field, values)
      if (error) nextErrors[field] = error
    }

    setErrors(nextErrors)
    setApiError([])

    if (Object.keys(nextErrors).length) return

    createStatistic()
  }

  function handleOpenCreateVariantModal() {
    setEditVariantIndex(null)
    setOpenVariantModal(true)
  }

  function handleOpenEditVariantModal(index: number) {
    setEditVariantIndex(index)
    setOpenVariantModal(true)
  }

  function handleSetOpenVariantModal(open: boolean) {
    setOpenVariantModal(open)
    if (!open) {
      setEditVariantIndex(null)
    }
  }

  if (!isAdmin) return <ErrorPage type={ErrorType.NOTAUTH} />
  if (hasInvalidShortname) return <ErrorPage type={ErrorType.NOTFOUND} />

  function getFieldLabel(label: string, field: keyof StatisticFormValues) {
    if (isRequired(field)) {
      return (
        <span>
          {label} <Tag data-color='warning'>Må fylles ut</Tag>
        </span>
      )
    }

    return label
  }

  return (
    <>
      {!createdShortname && <CreateShortnameModal openCreateShortnameModal />}

      {createdShortname && (
        <div className='create-statistic-container'>
          {isRouteValidated && <Paragraph>Laster opprettelsesskjema...</Paragraph>}
          {openVariantModal && (
            <VariantModal
              openVariantModal={openVariantModal}
              setOpenVariantModal={handleSetOpenVariantModal}
              setCreatedVariants={setCreatedVariants}
              editVariantIndex={editVariantIndex}
              editVariantValues={editVariantIndex !== null ? createdVariants[editVariantIndex] : undefined}
            />
          )}
          {!isRouteValidated && apiError.length > 0 && <ErrorAlert message={apiError} />}
          {!isRouteValidated && (
            <Alert data-color='success'>
              <Heading level={2} data-size='xs'>
                Kortnavnet er nå registrert i systemet
              </Heading>
              <Paragraph>
                Fyll ut resten av informasjonen. Alle obligatoriske felter må fylles ut før du kan opprette den endelige
                statistikken.
              </Paragraph>
            </Alert>
          )}
          {!isRouteValidated && (
            <Heading level={1} data-size='md' className='create-statistic-heading'>
              Opprett statistikk
            </Heading>
          )}
          {!isRouteValidated && (
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
                          Statistikker som har blitt opprettet med status «Aktiv», kan ikke bli gjort om til «Kommende»
                          igjen.
                        </li>
                        <li>
                          For å slette en statistikk som har blitt feilopprettet må du ta kontakt med mailadresse@ssb.no
                        </li>
                      </ul>
                    </Popover>
                  </Popover.TriggerContext>
                </div>
                <Field.Description>
                  Statistikker som er nyopprettet får status «Kommende». For å sette den til «Aktiv» må du i tillegg
                  fylle ut: Engelsk navn, varianter og målform.
                </Field.Description>
                <Select
                  width='auto'
                  value={values.status}
                  onChange={(e) =>
                    setValues((prevValues) => ({ ...prevValues, status: e.target.value as CreatableStatisticStatus }))
                  }
                >
                  <Select.Option value='K'>Kommende</Select.Option>
                </Select>
              </Field>
              <Divider />
              <Field>
                <Label>Kortnavn</Label>
                <Field.Description>
                  Kortnavnet kan ikke endres etter statistikken har blitt opprettet.
                </Field.Description>
                <Input readOnly value={createdShortname} />
              </Field>
              <Field>
                <Label>{getFieldLabel('Norsk statistikknavn', 'name')}</Label>
                <Input
                  aria-invalid={!!errors.name}
                  value={values.name}
                  onChange={(e) => setValues((prevValues) => ({ ...prevValues, name: e.target.value }))}
                  onBlur={() => handleOnBlur('name')}
                />
                {errors.name && <ValidationMessage>{errors.name}</ValidationMessage>}
              </Field>
              <Field>
                <Label>{getFieldLabel('Engelsk statistikknavn', 'name_en')}</Label>
                <Input
                  value={values.name_en}
                  onChange={(e) => setValues((prevValues) => ({ ...prevValues, name_en: e.target.value }))}
                />
              </Field>
              <Divider />
              <div className='created-variants-title-container'>
                <Heading level={2}>Variant</Heading>
                <Paragraph>Legg til variant for å kunne melde publiseringsdato på statistikken</Paragraph>
              </div>
              {createdVariants.length > 0 && (
                <div className='created-variants-container'>
                  {createdVariants.map((variant, index) => (
                    <Card
                      key={['created-variant', variant.frequency?.code ?? index, variant.revision?.code ?? index].join(
                        '-'
                      )}
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
                  ))}
                </div>
              )}
              <Button variant='secondary' onClick={handleOpenCreateVariantModal}>
                <PlusCircleIcon /> Legg til variant
              </Button>
              <Divider />
              <div className='contact-section'>
                <Heading level={2} data-size='xs'>
                  Kontakter
                </Heading>
                <Paragraph className='contact-section-description'>
                  Søk og legg til kontakt. Navn vises under overskriften 'Kontakt' på statistikksiden på ssb.no
                </Paragraph>
                <Field className='contact-field'>
                  <ContactSelection contacts={contacts} selected={selectedContacts} setSelected={setSelectedContacts} />
                </Field>
              </div>
              <Divider />
              <Heading level={2}>Detaljer</Heading>
              <Field>
                <Label>{getFieldLabel('Seksjon', 'division')}</Label>
                <Select
                  aria-invalid={!!errors.division}
                  value={values.division}
                  onChange={(e) => setValues((prevValues) => ({ ...prevValues, division: e.target.value }))}
                  onBlur={() => handleOnBlur('division')}
                >
                  <Select.Option value='' disabled />
                  {divisions.map(({ code, name }) => (
                    <Select.Option key={`division-${code}`} value={code}>
                      {name} ({code})
                    </Select.Option>
                  ))}
                </Select>
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
                  onChange={(e) => setValues((prevValues) => ({ ...prevValues, main_language: e.target.value }))}
                >
                  <Select.Option value='nb'>Bokmål</Select.Option>
                  <Select.Option value='nn'>Nynorsk</Select.Option>
                </Select>
              </Field>
              <Field>
                <Label>Statistikkens startår</Label>
                <Field.Description>F.eks 1876</Field.Description>
                <Input
                  maxLength={4}
                  size={4}
                  aria-invalid={!!errors.first_released_at}
                  value={values.first_released_at}
                  onChange={(e) => setValues((prevValues) => ({ ...prevValues, first_released_at: e.target.value }))}
                  onBlur={() => handleOnBlur('first_released_at')}
                />
                {errors.first_released_at && <ValidationMessage>{errors.first_released_at}</ValidationMessage>}
              </Field>
              <Divider />
              <Field>
                <Label>Kommentar (Valgfritt)</Label>
                <Field.Description>Annen relevant informasjon.</Field.Description>
                <Input
                  value={values.comment}
                  onChange={(e) => setValues((prevValues) => ({ ...prevValues, comment: e.target.value }))}
                />
              </Field>
              <div className='create-statistic-form-buttons'>
                <Button type='submit'>Opprett</Button>
                <Button
                  type='button'
                  variant='tertiary'
                  onClick={() => {
                    navigate('/statistikk')
                  }}
                >
                  Avbryt
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
          )}
        </div>
      )}
    </>
  )
}
