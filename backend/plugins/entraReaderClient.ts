import type { EntraUser, GraphUserResponse, TokenResponse } from '@/types/entra'
import { URLSearchParams } from 'node:url'

export const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0'

let cachedToken: string | null = null
let tokenExpiresAt = 0
let tokenPromise: Promise<string> | null = null

export function setCachedToken(token: string | null) {
  cachedToken = token
}

export function setTokenExpiresAt(time: number) {
  tokenExpiresAt = time
}

export function setTokenPromise(promise: Promise<string> | null) {
  tokenPromise = promise
}

export async function getAccessToken(): Promise<string> {
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

export async function fetchUserByEmail(userEmail: string, token: string): Promise<EntraUser | null> {
  if (!userEmail) {
    console.log(`Missing user email`)
    return null
  }
  if (!token) {
    throw new Error(`Missing token`)
  }
  const response = await fetch(
    `${GRAPH_BASE_URL}/users/${encodeURIComponent(userEmail)}?$select=displayName,businessPhones,mail,userPrincipalName`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const user = (await response.json()) as GraphUserResponse

  return {
    displayName: user.displayName,
    email: user.mail ?? user.userPrincipalName ?? null,
    businessPhone: user.businessPhones?.[0] ?? null,
  }
}
