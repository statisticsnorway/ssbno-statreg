import { createContext, use, useEffect, useState, useMemo, type ReactNode } from 'react'
import { type AuthResponse } from '@ssbno-statreg/shared'
import client from '../api'

const SESSION_STORAGE_KEY = 'auth'

type AuthContextValue = {
  auth: AuthResponse | null | undefined
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchAuthState(): Promise<AuthResponse | undefined> {
  const result = await client.GET('/auth/authenticate')

  if (!result.data) {
    console.log(result.response)
  }

  return result.data
}

function readFromSessionStorage(): AuthResponse | undefined | null {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
    return stored ? (JSON.parse(stored) as AuthResponse) : null
  } catch {
    return null
  }
}

function writeToSessionStorage(auth: AuthResponse | undefined): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(auth))
  } catch {
    // sessionStorage may be unavailable in some private-browsing environments
    console.warn('Failed to write auth data to sessionStorage')
  }
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [auth, setAuth] = useState<AuthResponse | undefined | null>(() => readFromSessionStorage())
  const [loading, setLoading] = useState(!auth)

  const authContextProps = useMemo(() => ({ auth, loading }), [auth, loading])

  useEffect(() => {
    if (auth) return

    fetchAuthState()
      .then((data) => {
        writeToSessionStorage(data)
        setAuth(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [auth])

  return <AuthContext value={authContextProps}>{children}</AuthContext>
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
