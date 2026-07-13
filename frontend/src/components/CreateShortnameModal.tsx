import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Button, Heading, Dialog, Field, Input, ValidationMessage, Paragraph } from '@digdir/designsystemet-react'

import client from '../api'
import type { ShortnameListing, Shortname } from '@ssbno-statreg/shared'
import { useAuth } from '../context/AuthContext'
import { ErrorAlert } from '../components/ErrorAlert'

type CreateShortnameModalProps = {
  openCreateShortnameModal: boolean
  setOpenCreateReleaseModal: (open: boolean) => void
  setCreatedShortname: (shortname: Shortname) => void
}

export function CreateShortnameModal({
  openCreateShortnameModal,
  setOpenCreateReleaseModal,
  setCreatedShortname,
}: Readonly<CreateShortnameModalProps>) {
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
        setApiError((prev) => [...prev, error.error])
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (error as any).error
      console.log(errorMessage)
      setApiError((prev) => [...prev, errorMessage])
    } else {
      setCreatedShortname(data)
      setOpenCreateReleaseModal(false)
    }
  }

  function handleOnSubmit(e: React.ChangeEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validateShortname()) return
    createShortname()
  }

  function handleCloseModal() {
    setOpenCreateReleaseModal(false)
    navigate(-1) // Navigate back to the previous page
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
