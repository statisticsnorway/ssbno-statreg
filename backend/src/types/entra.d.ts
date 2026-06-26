
export type TokenResponse = {
  access_token: string
  expires_in: number
}

export type GraphUserResponse = {
  displayName: string
  businessPhones?: string[]
  mail?: string
  userPrincipalName?: string | undefined // MIM-2778: This field should not be optional
}

export type GraphUsersResponse = {
  value: GraphUserResponse[]
  '@odata.nextLink'?: string
}

export type EntraUser = {
  displayName: string
  email?: string  | null
  userPrincipalName?: string | undefined // MIM-2778: This field should not be optional
  businessPhone: string | null
}

export type UserLookupItem = {
  lookupEmail: string
  user: EntraUser | null
  error?: string | null
}

export type Users = { 
  username: string | null
  email: string 
}