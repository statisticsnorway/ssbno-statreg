import { useAuth } from '../context/AuthContext'

export default function EditStatistic() {
  const { auth } = useAuth()

  if (!auth?.isAdmin) return <h1>Du har ikke tilgang til denne siden.</h1>
  return <h1>EditStatistic will be served here!</h1>
}
