import type { EntraUser, GraphUsersResponse, TokenResponse } from '@/types/entra'
import { URLSearchParams } from 'node:url'

export const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0'

let cachedToken: string | null = null
let tokenExpiresAt = 0
let tokenPromise: Promise<string | null> | null = null

export function setCachedToken(token: string | null) {
  cachedToken = token
}

export function setTokenExpiresAt(time: number) {
  tokenExpiresAt = time
}

export function setTokenPromise(promise: Promise<string | null> | null) {
  tokenPromise = promise
}

export async function getAccessToken(): Promise<string | null> {
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

export async function fetchAllUsers(token: string): Promise<EntraUser[]> {
  if (!token) {
    throw new Error('Missing token')
  }

  const users: EntraUser[] = []
  let nextUrl: string | null =
    `${GRAPH_BASE_URL}/users?$filter=accountEnabled eq true and userType eq 'Member'&$select=displayName,businessPhones,mail,userPrincipalName&$top=999`

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Graph users request failed: ${response.status} ${await response.text()}`)
    }

    const body = (await response.json()) as GraphUsersResponse

    for (const user of body.value) {
      users.push(user)
    }

    // Microsoft Graph may return a paged result even when requesting $top=999 in the url query.
    // If Graph returns a paged response, follow @odata.nextLink to fetch the next batch of users.
    nextUrl = body['@odata.nextLink'] ?? null
  }

  return users
}
