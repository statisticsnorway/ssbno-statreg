import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import { Alert, Heading, Paragraph } from '@digdir/designsystemet-react'

import ErrorPage, { ErrorType } from './ErrorPage'
import { CreateShortnameModal } from '../components/CreateShortnameModal'

export default function CreateStatistic() {
  const [openCreateShortnameModal, setOpenCreateReleaseModal] = useState(true)
  const { auth } = useAuth()

  if (!auth?.isAdmin) return <ErrorPage type={ErrorType.NOTAUTH} />

  return (
    <>
      <Alert data-color='success'>
        <Heading level={2} data-size='xs'>
          Kortnavnet er nå registrert i systemet
        </Heading>
        <Paragraph>
          Fyll ut resten av informasjonen. Alle obligatoriske felter må fylles ut før du kan opprette den endelige
          statistikken.
        </Paragraph>
      </Alert>
      <CreateShortnameModal
        openCreateShortnameModal={openCreateShortnameModal}
        setOpenCreateReleaseModal={setOpenCreateReleaseModal}
      />
    </>
  )
}
