import { useNavigate, useParams } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import {
  Heading,
  Popover,
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

import { isCreateStatisticFieldRequired, ApprovalStatus } from '@ssbno-statreg/shared'
import type {
  CreatableStatisticStatus,
  Division,
  Shortname,
  StatisticDetails,
  StatisticUpdate,
} from '@ssbno-statreg/shared'
import ErrorPage, { ErrorType } from './ErrorPage'
import { ErrorAlert } from '../components/ErrorAlert'
import type { StatisticFormErrors, StatisticFormField, StatisticFormValues } from './CreateStatistic'

const defaultValues: StatisticFormValues = {
  name: '',
  name_en: '',
  division: '',
  main_language: 'nb',
  first_released_at: '',
  comment: '',
}

function getStatisticFormValues(statistic: StatisticDetails | StatisticUpdate): StatisticFormValues {
  const division = typeof statistic.division === 'string' ? statistic.division : statistic.division?.code

  return {
    name: statistic.name ?? '',
    name_en: statistic.name_en ?? '',
    division: division ?? '',
    main_language: statistic.main_language ?? 'nb',
    first_released_at: statistic.first_released_at?.slice(0, 4) ?? '',
    comment: statistic.comment ?? '',
  }
}

function getEditableStatus(statusCode?: string): CreatableStatisticStatus {
  return statusCode === 'A' ? 'A' : 'K'
}

function getRegionLevelCodes(statistic: StatisticDetails): string[] {
  return statistic.statistic_region_levels?.flatMap((regionLevel) => (regionLevel.code ? [regionLevel.code] : [])) ?? []
}

type StatisticValidationState = {
  status: CreatableStatisticStatus
  values: StatisticFormValues
}

export default function EditStatistic() {
  const { shortname } = useParams<Shortname['shortname']>()

  const [statistic, setStatistic] = useState<StatisticDetails>({})
  const [divisions, setDivisions] = useState<Division[]>([])

  const {
    getCheckboxProps,
    value: regionLevelValues,
    setValue: setRegionLevelValues,
  } = useCheckboxGroup({
    name: 'region-level-checkbox',
    value: [],
  })

  const fieldsToValidate: StatisticFormField[] = [...Object.keys(defaultValues)] as StatisticFormField[]

  const [status, setStatus] = useState<CreatableStatisticStatus>('K')
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

      setStatistic(nextStatistic)
      setStatus(getEditableStatus(nextStatistic.status?.code))
      setValues(getStatisticFormValues(nextStatistic))
      setRegionLevelValues(getRegionLevelCodes(nextStatistic))
      setErrors({})

      await Promise.all([fetchDivisions()])
    }

    initializeUpdateStatistic()
  }, [isAdmin, setRegionLevelValues, shortname])

  function isRequired(field: StatisticFormField) {
    return isCreateStatisticFieldRequired(status, field) || field === 'comment'
  }

  function getValidationState(nextValues = values, nextStatus = status): StatisticValidationState {
    return {
      status: nextStatus,
      values: nextValues,
    }
  }

  function validateField(field: StatisticFormField, validationState: StatisticValidationState): string {
    if (field === 'comment' && !validationState.values.comment) return 'Fyll inn kommentar'

    // Optional field validation
    if (
      field === 'first_released_at' &&
      validationState.values.first_released_at &&
      !/^\d{4}$/.test(validationState.values.first_released_at)
    ) {
      return 'Statistikkens startår må være et gyldig år med fire siffer'
    }

    if (!isCreateStatisticFieldRequired(validationState.status, field)) {
      return ''
    }

    if (field === 'name' && !validationState.values.name) return 'Fyll inn norsk statistikknavn'
    if (field === 'name_en' && !validationState.values.name_en) return 'Fyll inn engelsk statistikknavn'
    if (field === 'division' && !validationState.values.division) return 'Velg ansvarlig seksjon for statistikken'

    return ''
  }

  function updateFieldErrors(
    fields: StatisticFormField[],
    validationState: StatisticValidationState,
    shouldAddNewErrors = true
  ) {
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }

      for (const field of fields) {
        const error = validateField(field, validationState)

        if (error) {
          if (shouldAddNewErrors || nextErrors[field]) {
            nextErrors[field] = error
          }
        } else {
          delete nextErrors[field]
        }
      }

      return nextErrors
    })
  }

  function handleValueChange<K extends keyof StatisticFormValues>(field: K, value: StatisticFormValues[K]) {
    const nextValues = { ...values, [field]: value }

    setValues(nextValues)
    updateFieldErrors([field], getValidationState(nextValues), field !== 'first_released_at')
  }

  function handleStatusChange(nextStatus: CreatableStatisticStatus) {
    setStatus(nextStatus)
    updateFieldErrors(fieldsToValidate, getValidationState(values, nextStatus), false)
  }

  function handleOnBlur(field: StatisticFormField) {
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }
      const error = validateField(field, getValidationState())

      if (error) nextErrors[field] = error
      else delete nextErrors[field]

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
      relation: statistic.relation?.shortname,
      yearly_reporting: statistic.yearly_reporting,
      previous_topic_codes: statistic.previous_topic_codes,
      variants: statistic.variants,
      contacts: statistic.contacts?.map((contact) => contact.principalName),
    }

    const { data, error } = await client.PUT(`/statistics/{shortname}`, {
      params: { path: { shortname: shortname as string } },
      body,
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
    const validationState = getValidationState()

    for (const field of fieldsToValidate) {
      const error = validateField(field, validationState)
      if (error) nextErrors[field] = error
    }

    setErrors(nextErrors)
    setApiError([])

    if (Object.keys(nextErrors).length) return

    updateStatistic()
  }

  function getFieldLabel(label: string, field: StatisticFormField) {
    if (isRequired(field)) {
      return (
        <span>
          {label} <Tag data-color='warning'>Må fylles ut</Tag>
        </span>
      )
    }

    return label
  }

  console.log(statistic)

  if (!auth?.isAdmin) return <ErrorPage type={ErrorType.NOTAUTH} />

  return (
    <>
      {statistic && (
        <div className='create-statistic-container'>
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
                        Statistikker som har blitt opprettet med status «Aktiv», kan ikke bli gjort om til «Kommende»
                        igjen.
                      </li>
                      <li>
                        For å slette en statistikk som har blitt feilopprettet må du ta kontakt med mailadresse@ssb.no
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
                Statistikker som er nyopprettet får status «Kommende». For å sette den til «Aktiv» må du i tillegg fylle
                ut: Engelsk navn, varianter og kontakter.
              </Field.Description>
              <Select
                width='auto'
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as CreatableStatisticStatus)}
              >
                <Select.Option value='K' disabled={statistic.status?.code === 'A'}>
                  Kommende
                </Select.Option>
                <Select.Option value='A'>Aktiv</Select.Option>
              </Select>
            </Field>
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
                onBlur={() => handleOnBlur('name')}
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
                onBlur={() => handleOnBlur('name_en')}
              />
              {errors.name_en && <ValidationMessage>{errors.name_en}</ValidationMessage>}
            </Field>
            <Divider />
            <Heading level={2}>Detaljer</Heading>
            <Field>
              <Label>{getFieldLabel('Seksjon', 'division')}</Label>
              <Select
                id='division'
                aria-invalid={!!errors.division}
                value={values.division}
                onChange={(e) => handleValueChange('division', e.target.value)}
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
                onBlur={() => handleOnBlur('first_released_at')}
              />
              {errors.first_released_at && <ValidationMessage>{errors.first_released_at}</ValidationMessage>}
            </Field>
            <Divider />
            <Field>
              <Label>{getFieldLabel('Kommentar', 'comment')}</Label>
              <Field.Description>Annen relevant informasjon.</Field.Description>
              <Input value={values.comment} onChange={(e) => handleValueChange('comment', e.target.value)} />
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
