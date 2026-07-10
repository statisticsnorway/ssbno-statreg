import { useState } from 'react'
import { Button, Heading, Dialog, Field, Input, ValidationMessage, Paragraph } from '@digdir/designsystemet-react'

type CreateShortnameModalProps = {
  openCreateShortnameModal: boolean
  setOpenCreateReleaseModal: (open: boolean) => void
}

export function CreateShortnameModal({
  openCreateShortnameModal,
  setOpenCreateReleaseModal,
}: CreateShortnameModalProps) {
  const [validationError, setValidationError] = useState('')
  const [shortname, setShortname] = useState('')

  function validateShortname() {
    if (!shortname) {
      setValidationError('Fyll ut et kortnavn')
      return
    }

    const validShortnameCharacters = shortname.match(/[^a-z-]/g)
    if (validShortnameCharacters) {
      const invalidChars = [...new Set(validShortnameCharacters)]
      setValidationError(`Kortnavnet inneholder ugyldige tegn: ${invalidChars.join(', ')}`)
      return
    }

    setValidationError('')
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setShortname(e.target.value)
  }

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
        <Field>
          <Field.Description>
            Du må registrere et kortnavn før du kan fylle ut resten av informasjonen om statistikken. Kortnavnet kan
            ikke endres etter at statistikken har blitt opprettet. Maks 14 tegn, kun små bokstaver og bindestrek er lov.
          </Field.Description>
          <Input aria-invalid={!!validationError} onChange={handleChange} onBlur={validateShortname} />
          <Paragraph data-limit='14' data-field='counter' />
          {validationError && <ValidationMessage>{validationError}</ValidationMessage>}

          {/* TODO: Check with fetch shortname? */}
          <ValidationMessage>Dette kortnavnet er ikke ledig</ValidationMessage>
          <ValidationMessage data-color='success'>Kortnavn er ledig</ValidationMessage>
        </Field>
        <div style={{ display: 'flex' }}>
          <Button variant='primary'>Opprett kortnavn</Button>
          <Button variant='tertiary' onClick={() => setOpenCreateReleaseModal(false)}>
            Avbryt
          </Button>
        </div>
      </Dialog.Block>
    </Dialog>
  )
}
