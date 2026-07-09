import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import ErrorPage, { ErrorType } from './ErrorPage'
import { CreateShortnameModal } from '../components/CreateShortnameModal'

export default function CreateStatistic() {
  const [openCreateShortnameModal, setOpenCreateReleaseModal] = useState(true)
  const { auth } = useAuth()

  if (!auth?.isAdmin) return <ErrorPage type={ErrorType.NOTAUTH} />

  return (
    <>
      <CreateShortnameModal
        openCreateShortnameModal={openCreateShortnameModal}
        setOpenCreateReleaseModal={setOpenCreateReleaseModal}
      />
    </>
  )
}
