import { useAuth } from '../context/AuthContext'
import ErrorPage, { ErrorType } from './ErrorPage'

export default function CreateStatistic() {
  const { auth } = useAuth()

  if (!auth?.isAdmin) return <ErrorPage type={ErrorType.NOTAUTH} />

  return <h1>CreateStatistic will be served here!</h1>
}
