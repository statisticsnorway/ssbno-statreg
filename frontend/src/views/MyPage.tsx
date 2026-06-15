import { useAuth } from '../context/AuthContext'
import ErrorPage, { ErrorType } from './ErrorPage'

export default function MyPage() {
  const { auth } = useAuth()

  if (!auth?.isAdmin) return <ErrorPage type={ErrorType.NOTAUTH} />

  return <h1>MyPage will be served here!</h1>
}
