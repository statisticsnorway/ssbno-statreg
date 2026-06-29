
export type TokenResponse = {
  access_token: string
  expires_in: number
}

type GraphUserResponse = {
  displayName: string
  businessPhones?: string[]
  mail?: string
  userPrincipalName: string | undefined
}

export type GraphUsersResponse = {
  value: GraphUserResponse[]
  '@odata.nextLink'?: string
}

export type EntraUser = {
  displayName: string
  email?: string  | null
  userPrincipalName: string | undefined
  businessPhone: string | null
}

export type UserLookupItem = {
  lookupEmail: string
  user: EntraUser | null
  error?: string | null
}

export type Users = { 
  username: string | null
}