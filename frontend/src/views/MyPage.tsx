import { useAuth } from '../context/AuthContext'

export default function MyPage() {
  const { auth } = useAuth()

  if (!auth?.isAdmin) return <h1>Du har ikke tilgang til denne siden.</h1>
  return <h1>MyPage will be served here!</h1>
}
