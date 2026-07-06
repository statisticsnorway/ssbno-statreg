import { Heading } from '@digdir/designsystemet-react'
import { useAuth } from '../context/AuthContext'
import ErrorPage, { ErrorType } from './ErrorPage'

export default function MyPage() {
  const { auth } = useAuth()

  if (!auth?.isAdmin) return <ErrorPage type={ErrorType.NOTAUTH} />

  return (
    <div>
      <Heading level={2} data-size='sm'>
        Oppgaver
      </Heading>
    </div>
  )
}
