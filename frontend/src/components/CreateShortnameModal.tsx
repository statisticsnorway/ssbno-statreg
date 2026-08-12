import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Button, Heading, Dialog, Field, Input, ValidationMessage, Paragraph } from '@digdir/designsystemet-react'

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

  function validateShortname() {
    if (!shortnameInput) {
      setValidationError('Fyll ut et kortnavn')
      return false
    }

    const invalidShortnameCharacters = shortnameInput.match(/[^a-z_]/g)
    if (invalidShortnameCharacters) {
      const invalidChars = [...new Set(invalidShortnameCharacters)]
      setValidationError(`Kortnavnet inneholder ugyldige tegn: ${invalidChars.join(', ')}`)
      return false
    }

    if (shortnameInput.length > 14) {
      setValidationError('Kortnavnet kan ikke være lengre enn 14 tegn')
      return false
    }

    if (shortnames.includes(shortnameInput)) {
      setValidationError('Dette kortnavnet er ikke ledig')
      return false
    }

    setValidationError('')
    return true
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setShortnameInput(e.target.value)
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

  function handleOnSubmit(e: React.ChangeEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validateShortname()) return
    createShortname()
  }

  function handleCloseModal() {
    navigate('/statistikk')
  }

  return (
    <Dialog id='create-shortname-modal' open={openCreateShortnameModal} onClose={handleCloseModal}>
      <Dialog.Block>
        <Heading data-size='xs'>Opprett kortnavn for statistikken</Heading>
      </Dialog.Block>
      <Dialog.Block>
        {apiError.length > 0 && <ErrorAlert message={apiError} />}
        <form onSubmit={handleOnSubmit}>
          <Field>
            <Field.Description>
              Du må registrere et kortnavn før du kan fylle ut resten av informasjonen om statistikken. Kortnavnet kan
              ikke endres etter at statistikken har blitt opprettet. Maks 14 tegn, kun små bokstaver og understrek er
              lov.
            </Field.Description>
            <Input aria-invalid={!!validationError} onChange={handleInputChange} onBlur={validateShortname} />
            <Paragraph data-limit='14' data-field='counter' />
            {validationError ? (
              <ValidationMessage>{validationError}</ValidationMessage>
            ) : (
              shortnameInput && <ValidationMessage data-color='success'>Kortnavn er ledig</ValidationMessage>
            )}
          </Field>
          <div style={{ display: 'flex', marginTop: 'var(--ds-size-3)' }}>
            <Button variant='primary' type='submit'>
              Opprett kortnavn
            </Button>
            <Button variant='tertiary' onClick={handleCloseModal}>
              Avbryt
            </Button>
          </div>
        </form>
      </Dialog.Block>
    </Dialog>
  )
}
