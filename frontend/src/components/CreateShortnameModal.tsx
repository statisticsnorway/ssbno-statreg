import { Button, Heading, Dialog, Field, Input, ValidationMessage, Paragraph } from '@digdir/designsystemet-react'

export function CreateShortnameModal({ openCreateShortnameModal, setOpenCreateReleaseModal }) {
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
          <Input />
          <Paragraph data-limit='14' data-field='counter' />
          <ValidationMessage>Fyll ut et kortnavn</ValidationMessage>
          <ValidationMessage>Dette kortnavnet er ikke ledig</ValidationMessage>
          <ValidationMessage>Kortnavnet inneholder ikke gyldige tegn</ValidationMessage>
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
