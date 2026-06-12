import { createContext, use, useEffect, useState, useMemo, type ReactNode } from 'react'
import { type AuthResponse } from '@ssbno-statreg/shared'
import client from '../api'

const SESSION_STORAGE_KEY = 'auth'

type AuthContextValue = {
  auth: AuthResponse | null | undefined
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchAuthState(): Promise<AuthResponse | undefined> {
  const { data, error } = await client.GET('/auth/authenticate')
  if (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorMessage = (error as any).error
    console.log(errorMessage)
    alert(errorMessage)
  } else {
    return data
  }
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
  }
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [auth, setAuth] = useState<AuthResponse | undefined | null>(() => readFromSessionStorage())
  const [isLoading, setIsLoading] = useState(auth === null)
  const authContextProps = useMemo(() => ({ auth, isLoading }), [auth, isLoading])

  useEffect(() => {
    if (auth) return

    fetchAuthState()
      .then((data) => {
        writeToSessionStorage(data)
        setAuth(data)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [auth])

  return <AuthContext value={authContextProps}>{children}</AuthContext>
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
