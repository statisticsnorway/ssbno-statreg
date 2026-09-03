import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Button, Heading, Dialog, Textfield, ValidationMessage } from '@statisticsnorway/design-react'

import client from '../api'
import type { ShortnameListing } from '@ssbno-statreg/shared'
import { useAuth } from '../context/AuthContext'
import { ErrorAlert } from '../components/ErrorAlert'

type CreateShortnameModalProps = {
  openCreateShortnameModal: boolean
}

export function CreateShortnameModal({ openCreateShortnameModal }: Readonly<CreateShortnameModalProps>) {
  const { auth } = useAuth()

  const [shortnames, setShortnames] = useState<ShortnameListing['shortname'][]>([])
  const [apiError, setApiError] = useState<string[]>([])

  const [validationError, setValidationError] = useState('')
  const [shortnameInput, setShortnameInput] = useState('')

  const navigate = useNavigate()
  const isAdmin = auth?.isAdmin ?? false

  useEffect(() => {
    if (!isAdmin) return
    async function fetchShortnames() {
      const { data, error } = await client.GET('/shortnames')
      if (error) {
        setApiError((prev) => [...prev, error.message])
        return
      }
      setShortnames(data.map(({ shortname }) => shortname ?? '') ?? [])
    }
    fetchShortnames()
  }, [isAdmin])

  function validateShortname(value: string) {
    if (!value) {
      setValidationError('Fyll ut et kortnavn')
      return false
    }

    const invalidShortnameCharacters = value.match(/[^a-z_]/g)
    if (invalidShortnameCharacters) {
      const invalidChars = [...new Set(invalidShortnameCharacters)]
      setValidationError(`Kortnavnet inneholder ugyldige tegn: ${invalidChars.join(', ')}`)
      return false
    }

    if (shortnames.includes(value)) {
      setValidationError('Dette kortnavnet er ikke ledig')
      return false
    }

    setValidationError('')
    return true
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setShortnameInput(value)
    validateShortname(value)
  }

  async function createShortname() {
    const { data, error } = await client.POST('/shortnames', {
      body: {
        shortname: shortnameInput,
      },
    })
    if (error) {
      setApiError((prev) => [...prev, error.message])
      return
    }
    navigate(`/statistikk/${data.shortname}/opprett`)
  }

  function handleOnSubmit() {
    if (!validateShortname(shortnameInput)) return
    createShortname()
  }

  function handleCloseModal() {
    navigate('/statistikk', { state: { returnFocusToCreateStatisticButton: true } })
  }

  return (
    <Dialog
      id='create-shortname-modal'
      aria-labelledby='create-shortname-modal-heading'
      open={openCreateShortnameModal}
      onClose={handleCloseModal}
      closedby='any'
    >
      <Dialog.Block>
        <Heading id='create-shortname-modal-heading' data-size='xs'>
          Opprett kortnavn for statistikken
        </Heading>
      </Dialog.Block>
      <Dialog.Block>
        {apiError.length > 0 && <ErrorAlert message={apiError} />}
        <Textfield
          label=''
          description='Du må registrere et kortnavn før du kan fylle ut resten av informasjonen om statistikken. Kortnavnet kan ikke endres etter at statistikken har blitt opprettet. Maks 14 tegn, kun små bokstaver og understrek er lov.'
          onChange={handleInputChange}
          maxLength={14}
          counter={14}
          error={validationError}
          value={shortnameInput}
          // @ts-expect-error native "autofocus" is not part of the React types
          autofocus='true'
        />
        {!validationError && shortnameInput && (
          <ValidationMessage data-color='success' data-field='validation'>
            Kortnavn er ledig
          </ValidationMessage>
        )}
        <div style={{ display: 'flex', gap: 'var(--ds-size-2)', marginTop: 'var(--ds-size-3)' }}>
          <Button variant='primary' onClick={handleOnSubmit}>
            Opprett kortnavn
          </Button>
          <Button variant='tertiary' onClick={handleCloseModal}>
            Avbryt
          </Button>
        </div>
      </Dialog.Block>
    </Dialog>
  )
}
