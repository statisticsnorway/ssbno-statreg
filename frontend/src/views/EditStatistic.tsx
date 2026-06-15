import { useAuth } from '../context/AuthContext'
import ErrorPage, { ErrorType } from './ErrorPage'

export default function EditStatistic() {
  const { auth } = useAuth()

  if (!auth?.isAdmin) return <ErrorPage type={ErrorType.NOTAUTH} />

  return <h1>EditStatistic will be served here!</h1>
}
