import { useState, useEffect } from 'react'
import { Button, Heading, Dialog, Field, Input, ValidationMessage, Paragraph } from '@digdir/designsystemet-react'

import client from '../api'
import type { ShortnameListing } from '@ssbno-statreg/shared'

type CreateShortnameModalProps = {
  openCreateShortnameModal: boolean
  setOpenCreateReleaseModal: (open: boolean) => void
}

export function CreateShortnameModal({
  openCreateShortnameModal,
  setOpenCreateReleaseModal,
}: CreateShortnameModalProps) {
  const [shortnames, setShortnames] = useState<ShortnameListing['shortname'][]>([])
  const [apiError, setApiError] = useState<string[]>([])

  const [validationError, setValidationError] = useState('')
  const [shortnameInput, setShortnameInput] = useState('')

  useEffect(() => {
    async function fetchShortnames() {
      const { data, error } = await client.GET('/shortnames')
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        console.log(errorMessage)
        setApiError((prev) => [...prev, errorMessage])
      } else {
        setShortnames(data.map(({ shortname }) => shortname ?? '') ?? [])
      }
    }
    fetchShortnames()
  }, [])

  function validateShortname() {
    if (!shortnameInput) {
      setValidationError('Fyll ut et kortnavn')
      return
    }

    const validShortnameCharacters = shortnameInput.match(/[^a-z-]/g)
    if (validShortnameCharacters) {
      const invalidChars = [...new Set(validShortnameCharacters)]
      setValidationError(`Kortnavnet inneholder ugyldige tegn: ${invalidChars.join(', ')}`)
      return
    }

    if (shortnames.includes(shortnameInput)) {
      setValidationError('Dette kortnavnet er ikke ledig')
      return
    }

    setValidationError('')
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setShortnameInput(e.target.value)
  }

  console.log('shortnames', shortnames)
  return (
    <Dialog
      id='create-shortname-modal'
      open={openCreateShortnameModal}
      onClose={() => setOpenCreateReleaseModal(false)}
    >
      <Dialog.Block>
        <Heading data-size='xs'>Opprett kortnavn for statistikken</Heading>
      </Dialog.Block>
      <Dialog.Block>
        <form>
          <Field>
            <Field.Description>
              Du må registrere et kortnavn før du kan fylle ut resten av informasjonen om statistikken. Kortnavnet kan
              ikke endres etter at statistikken har blitt opprettet. Maks 14 tegn, kun små bokstaver og bindestrek er
              lov.
            </Field.Description>
            <Input aria-invalid={!!validationError} onChange={handleChange} onBlur={validateShortname} />
            <Paragraph data-limit='14' data-field='counter' />
            {shortnameInput && validationError ? (
              <ValidationMessage>{validationError}</ValidationMessage>
            ) : (
              shortnameInput && <ValidationMessage data-color='success'>Kortnavn er ledig</ValidationMessage>
            )}
          </Field>
          <div style={{ display: 'flex', marginTop: 'var(--ds-size-3)' }}>
            <Button variant='primary'>Opprett kortnavn</Button>
            <Button variant='tertiary' onClick={() => setOpenCreateReleaseModal(false)}>
              Avbryt
            </Button>
          </div>
        </form>
      </Dialog.Block>
    </Dialog>
  )
}
