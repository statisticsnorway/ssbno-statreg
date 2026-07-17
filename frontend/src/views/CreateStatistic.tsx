import { useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
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
} from '@digdir/designsystemet-react'
import { QuestionmarkCircleIcon } from '@navikt/aksel-icons'

import client from '../api'

import './CreateStatistic.css'

import { isCreateStatisticFieldRequired, type CreatableStatisticStatus, ApprovalStatus } from '@ssbno-statreg/shared'
import ErrorPage, { ErrorType } from './ErrorPage'
import { ErrorAlert } from '../components/ErrorAlert'
import { CreateShortnameModal } from '../components/CreateShortnameModal'

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
  const [openCreateShortnameModal, setOpenCreateShortnameModal] = useState<boolean>(true)
  const [createdShortname, setCreatedShortname] = useState<string>('')

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
  const navigate = useNavigate()

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
        statistic_region_levels: regionLevelValues.length ? regionLevelValues.map((code: string) => code) : [],
        approval_status: ApprovalStatus['ACCEPTED'],
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

  if (!auth?.isAdmin) return <ErrorPage type={ErrorType.NOTAUTH} />

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
      {openCreateShortnameModal && (
        <CreateShortnameModal
          openCreateShortnameModal={openCreateShortnameModal}
          setOpenCreateReleaseModal={setOpenCreateShortnameModal}
          setCreatedShortname={setCreatedShortname}
        />
      )}

      {createdShortname && (
        <div className='create-statistic-container'>
          {apiError.length > 0 && <ErrorAlert message={apiError} />}
          <Alert data-color='success'>
            <Heading level={2} data-size='xs'>
              Kortnavnet er nå registrert i systemet
            </Heading>
            <Paragraph>
              Fyll ut resten av informasjonen. Alle obligatoriske felter må fylles ut før du kan opprette den endelige
              statistikken.
            </Paragraph>
          </Alert>
          <Heading level={1} data-size='md' className='create-statistic-heading'>
            Opprett statistikk
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
                Statistikker som er nyopprettet får status «Kommende». For å sette den til «Aktiv» må du i tillegg fylle
                ut: Engelsk navn, varianter og målform.
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
            <Heading level={2}>Navn</Heading>
            <Field>
              <Label>Kortnavn</Label>
              <Field.Description>Kortnavnet kan ikke endres etter statistikken har blitt opprettet.</Field.Description>
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
            <Heading level={2}>Detaljer</Heading>
            <Field>
              <Label>{getFieldLabel('Seksjon', 'division')}</Label>
              <Select
                width='auto'
                aria-invalid={!!errors.division}
                value={values.division}
                onChange={(e) => setValues((prevValues) => ({ ...prevValues, division: e.target.value }))}
                onBlur={() => handleOnBlur('division')}
              >
                <Select.Option value='' disabled />
                <Select.Option value='723'>Seksjon for formidlingsplattform</Select.Option>
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
              {/* TODO: Double check the flow/behavior for "Avbryt" button with designer. Set to form clear for now */}
              <Button
                type='button'
                variant='tertiary'
                onClick={() => {
                  setValues(defaultValues)
                  setErrors({})
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
        </div>
      )}
    </>
  )
}
