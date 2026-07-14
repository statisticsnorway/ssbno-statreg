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
} from '@digdir/designsystemet-react'
import { QuestionmarkCircleIcon } from '@navikt/aksel-icons'

import './CreateStatistic.css'

import type { Shortname } from '@ssbno-statreg/shared'
import ErrorPage, { ErrorType } from './ErrorPage'
import { CreateShortnameModal } from '../components/CreateShortnameModal'

export default function CreateStatistic() {
  const [openCreateShortnameModal, setOpenCreateShortnameModal] = useState(true)
  const [createdShortname, setCreatedShortname] = useState<Shortname | null>(null)

  const { auth } = useAuth()

  if (!auth?.isAdmin) return <ErrorPage type={ErrorType.NOTAUTH} />

  return (
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

      {openCreateShortnameModal && (
        <CreateShortnameModal
          openCreateShortnameModal={openCreateShortnameModal}
          setOpenCreateReleaseModal={setOpenCreateShortnameModal}
          setCreatedShortname={setCreatedShortname}
        />
      )}

      <Heading level={1} data-size='md' className='create-statistic-heading'>
        Opprett statistikk
      </Heading>

      <form className='create-statistic-form'>
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
                    For å slette en statistikk som har blitt feilopprettet må du ta kontakt med mailadresse@ssb.no
                  </li>
                </ul>
              </Popover>
            </Popover.TriggerContext>
          </div>
          <Field.Description>
            Statistikker som er nyopprettet får status «Kommende». For å sette den til «Aktiv» må du i tillegg fylle ut:
            Engelsk navn, varianter og målform.
          </Field.Description>
          <Select defaultValue='upcoming'>
            <Select.Option value='upcoming'>Kommende</Select.Option>
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
          <Label>Norsk statistikknavn</Label>
          <Input />
        </Field>
        <Field>
          <Label>Engelsk statistikknavn</Label>
          <Input />
        </Field>
        <Divider />
        <Heading level={2}>Detaljer</Heading>
        <Field>
          <Label>Seksjon</Label>
          <Select defaultValue=''>
            <Select.Option value='123'>Seksjon for ...</Select.Option>
          </Select>
        </Field>
        <Fieldset>
          <Fieldset.Legend>Regionale nivåer</Fieldset.Legend>
          <Checkbox label='Bydel og krets' />
          <Checkbox label='Kommune' />
          <Checkbox label='Fylke' />
          <Checkbox label='Landsdel' />
          <Checkbox label='Land' />
        </Fieldset>
        <Field>
          <Label>Målform</Label>
          <Select defaultValue=''>
            <Select.Option value='nb'>Bokmål</Select.Option>
            <Select.Option value='nn'>Nynorsk</Select.Option>
          </Select>
        </Field>
        <Field>
          <Label>Statistikkens startår</Label>
          <Field.Description>F.eks 1876</Field.Description>
          <Input />
        </Field>
        <Divider />
        <Field>
          <Label>Kommentar (Valgfritt)</Label>
          <Field.Description>Annen relevant informasjon.</Field.Description>
          <Input />
        </Field>
        <div className='create-statistic-form-buttons'>
          <Button type='submit'>Opprett</Button>
          <Button variant='tertiary'>Avbryt</Button>
        </div>
      </form>
    </div>
  )
}
