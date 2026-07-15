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
  Tag,
} from '@digdir/designsystemet-react'
import { QuestionmarkCircleIcon } from '@navikt/aksel-icons'

import './CreateStatistic.css'

import {
  isCreateStatisticFieldRequired,
  type CreateStatisticField,
  type CreatableStatisticStatus,
  type Shortname,
} from '@ssbno-statreg/shared'
import ErrorPage, { ErrorType } from './ErrorPage'
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

export default function CreateStatistic() {
  const [openCreateShortnameModal, setOpenCreateShortnameModal] = useState(true)
  const [createdShortname, setCreatedShortname] = useState<Shortname | null>(null)

  const { getCheckboxProps } = useCheckboxGroup({
    name: 'region-level-checkbox',
    value: [],
  })

  const defaultValues: StatisticFormValues = {
    status: 'K',
    name: '',
    name_en: '',
    division: '',
    main_language: '',
    first_released_at: '',
    comment: '',
  }

  const [values, setValues] = useState(defaultValues)

  const regionLevelCheckboxes = [
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

  const status = values.status

  function isRequired(field: CreateStatisticField) {
    return isCreateStatisticFieldRequired(status, field)
  }

  function getFieldLabel(label: string, field: CreateStatisticField) {
    if (isRequired(field)) {
      return (
        <span>
          {label} <Tag data-color='warning'>Må fylles ut</Tag>
        </span>
      )
    }
    return label
  }

  function validFields(): boolean {
    return true
  }

  function handleSubmit(e: React.ChangeEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validFields()) return

    console.log({ ...values, first_released_at: `${values.first_released_at}-12-31` })
  }

  if (!auth?.isAdmin) return <ErrorPage type={ErrorType.NOTAUTH} />

  return (
    <>
      {openCreateShortnameModal && (
        <CreateShortnameModal
          openCreateShortnameModal={openCreateShortnameModal}
          setOpenCreateReleaseModal={setOpenCreateShortnameModal}
          setCreatedShortname={setCreatedShortname}
        />
      )}

      {!openCreateShortnameModal && (
        <div className='create-statistic-container'>
          {createdShortname && (
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
                value={values.status}
                onChange={(e) => setValues({ ...values, status: e.target.value as CreatableStatisticStatus })}
              >
                <Select.Option value='K'>Kommende</Select.Option>
              </Select>
            </Field>
            <Divider />
            <Heading level={2}>Navn</Heading>
            <Field>
              <Label>Kortnavn</Label>
              <Field.Description>Kortnavnet kan ikke endres etter statistikken har blitt opprettet.</Field.Description>
              <Input readOnly value={createdShortname?.shortname} />
            </Field>
            <Field>
              <Label>{getFieldLabel('Norsk statistikknavn', 'name')}</Label>
              <Input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
            </Field>
            <Field>
              <Label>{getFieldLabel('Engelsk statistikknavn', 'name_en')}</Label>
              <Input
                required={isRequired('name_en')}
                value={values.name_en}
                onChange={(e) => setValues({ ...values, name_en: e.target.value })}
              />
            </Field>
            <Divider />
            <Heading level={2}>Detaljer</Heading>
            <Field>
              <Label>{getFieldLabel('Seksjon', 'division')}</Label>
              <Select value={values.division} onChange={(e) => setValues({ ...values, division: e.target.value })}>
                <Select.Option value='' disabled />
                <Select.Option value='123'>Seksjon for ...</Select.Option>
              </Select>
            </Field>
            <Fieldset>
              <Fieldset.Legend>Regionale nivåer</Fieldset.Legend>
              {regionLevelCheckboxes.map((regionLevel) => (
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
                value={values.main_language}
                onChange={(e) => setValues({ ...values, main_language: e.target.value })}
              >
                <Select.Option value='' disabled />
                <Select.Option value='nb'>Bokmål</Select.Option>
                <Select.Option value='nn'>Nynorsk</Select.Option>
              </Select>
            </Field>
            <Field>
              <Label>Statistikkens startår</Label>
              <Field.Description>F.eks 1876</Field.Description>
              <Input
                value={values.first_released_at}
                onChange={(e) => setValues({ ...values, first_released_at: e.target.value })}
              />
            </Field>
            <Divider />
            <Field>
              <Label>Kommentar (Valgfritt)</Label>
              <Field.Description>Annen relevant informasjon.</Field.Description>
              <Input value={values.comment} onChange={(e) => setValues({ ...values, comment: e.target.value })} />
            </Field>
            <div className='create-statistic-form-buttons'>
              <Button type='submit'>Opprett</Button>
              {/* TODO: Double check the flow/behavior for "Avbryt" button. Set to form clear for now */}
              <Button
                type='button'
                variant='tertiary'
                onClick={() => {
                  setValues(defaultValues)
                }}
              >
                Avbryt
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
