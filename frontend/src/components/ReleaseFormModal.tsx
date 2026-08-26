import { Link as ReactRouterLink } from 'react-router'
import { Paragraph, Button, Heading, Dialog } from '@statisticsnorway/design-react'
import { type ReleaseDetails } from '@ssbno-statreg/shared'

type ReleaseFormModalProps = {
  modalHeading: string
  modalDescription: string
  openCreateReleaseModal: boolean
  newOrUpdatedRelease: ReleaseDetails
  setOpenCreateReleaseModal: React.Dispatch<React.SetStateAction<boolean>>
}

export default function ReleaseFormModal({
  modalHeading,
  modalDescription,
  openCreateReleaseModal,
  newOrUpdatedRelease: createdRelease,
  setOpenCreateReleaseModal,
}: ReleaseFormModalProps) {
  const { id, statistic } = createdRelease ?? {}

  return (
    <Dialog
      aria-labelledby='release-modal-heading'
      open={openCreateReleaseModal}
      onClose={() => setOpenCreateReleaseModal(false)}
    >
      <Dialog.Block>
        <Heading id='release-modal-heading' data-size='xs'>
          {modalHeading}
        </Heading>
      </Dialog.Block>
      <Dialog.Block>
        <Paragraph id='release-modal-description'>{modalDescription}</Paragraph>
        <div style={{ display: 'flex', gap: 'var(--ds-size-4)', marginTop: ' var(--ds-size-4)' }}>
          <Button variant='primary' asChild>
            <ReactRouterLink
              // @ts-expect-error native "autofocus" is not part of the React types
              autofocus='true'
              aria-describedby='release-modal-description'
              to={`/statistikk/${statistic?.shortname}`}
              reloadDocument
            >
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
