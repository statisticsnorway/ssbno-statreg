import { Link as ReactRouterLink } from 'react-router'
import { Paragraph, Button, Heading, Dialog } from '@digdir/designsystemet-react'
import { type ReleaseDetails } from '@ssbno-statreg/shared'

type ReleaseFormModalProps = {
  modalHeading: string
  modalDescription: string
  openCreateReleaseModal: boolean
  createdRelease: ReleaseDetails
  setOpenCreateReleaseModal: React.Dispatch<React.SetStateAction<boolean>>
}

export default function ReleaseFormModal({
  modalHeading,
  modalDescription,
  openCreateReleaseModal,
  createdRelease,
  setOpenCreateReleaseModal,
}: ReleaseFormModalProps) {
  const { id, statistic } = createdRelease ?? {}

  return (
    <Dialog id='create-release-modal' open={openCreateReleaseModal} onClose={() => setOpenCreateReleaseModal(false)}>
      <Dialog.Block>
        <Heading data-size='xs'>{modalHeading}</Heading>
      </Dialog.Block>
      <Dialog.Block>
        <Paragraph>{modalDescription}</Paragraph>
      </Dialog.Block>
      <Dialog.Block>
        <div style={{ display: 'flex', gap: 'var(--ds-size-4)', marginTop: ' var(--ds-size-4)' }}>
          <Button variant='primary' asChild>
            <ReactRouterLink to={`/statistikk/${statistic?.shortname}`} reloadDocument>
              Ok
            </ReactRouterLink>
          </Button>
          <Button variant='tertiary' asChild>
            <ReactRouterLink to={`/publisering/${id}`}>Se detaljer</ReactRouterLink>
          </Button>
        </div>
      </Dialog.Block>
    </Dialog>
  )
}
