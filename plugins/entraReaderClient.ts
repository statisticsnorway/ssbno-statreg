import { URLSearchParams } from 'node:url'

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0'
const USER_DOMAIN = 'ssb.no'

type TokenResponse = {
  access_token: string
  expires_in: number
}

type GraphUserResponse = {
  displayName: string
  businessPhones?: string[]
  mail?: string
  userPrincipalName?: string
}

export type EntraUser = {
  displayName: string
  email: string | null
  businessPhone: string | null
}

export type UserLookupItem = {
  initials: string
  user: EntraUser | null
  error?: string | null
}

let cachedToken: string | null = null
let tokenExpiresAt = 0
let tokenPromise: Promise<string> | null = null

async function getAccessToken(): Promise<string> {
  const tenantId = process.env.ENTRA_READER_AZURE_TENANT_ID
  const clientId = process.env.ENTRA_READER_AZURE_CLIENT_ID
  const clientSecret = process.env.ENTRA_READER_AZURE_CLIENT_SECRET

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      'Missing Azure Entra configuration. Ensure AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET are set.'
    )
  }

  const now = Date.now()
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken
  }

  if (tokenPromise) {
    return tokenPromise
  }

  tokenPromise = (async () => {
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

    const body = new URLSearchParams()
    body.append('grant_type', 'client_credentials')
    body.append('client_id', clientId)
    body.append('client_secret', clientSecret)
    body.append('scope', 'https://graph.microsoft.com/.default')

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    if (!response.ok) {
      throw new Error(`OAuth token request failed: ${response.status} ${await response.text()}`)
    }

    const json = (await response.json()) as TokenResponse

    cachedToken = json.access_token
    tokenExpiresAt = Date.now() + (json.expires_in - 60) * 1000

    return cachedToken
  })()

  try {
    return await tokenPromise
  } finally {
    tokenPromise = null
  }
}

// Initials can be undefined for users such as informasjon@ssb.no, but initials should still be a required param while email is optional
export async function fetchUserByEmail(initials: string | null, email?: string): Promise<EntraUser | null> {
  const token = await getAccessToken()

  const userEmail = initials ? `${initials}@${USER_DOMAIN}` : (email as string)

  const response = await fetch(
    `${GRAPH_BASE_URL}/users/${encodeURIComponent(userEmail)}?$select=displayName,businessPhones,mail,userPrincipalName`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Graph request failed: ${response.status} ${await response.text()}`)
  }

  const user = (await response.json()) as GraphUserResponse

  return {
    displayName: user.displayName,
    email: user.mail ?? user.userPrincipalName ?? null,
    businessPhone: user.businessPhones?.[0] ?? null,
  }
}

export async function fetchUsersByInitials(idsParam: string | string[]) {
  if (!idsParam?.length) return null

  const initialsList = Array.isArray(idsParam)
    ? idsParam
    : idsParam
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)

  const results: UserLookupItem[] = await Promise.all(
    initialsList.map(async (initials): Promise<UserLookupItem> => {
      try {
        const user = await fetchUserByEmail(initials)

        if (user) {
          return {
            initials,
            user,
          }
        }

        return {
          initials,
          user: null,
          error: 'User not found',
        }
      } catch {
        return {
          initials,
          user: null,
          error: 'Lookup failed',
        }
      }
    })
  )

  if (results.length === 1) {
    const item = results[0]
    return item?.user ?? item
  }

  return results
}
