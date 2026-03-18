
export type TokenResponse = {
  access_token: string
  expires_in: number
}

export type GraphUserResponse = {
  displayName: string
  businessPhones?: string[]
  mail?: string
  userPrincipalName?: string
}

export type EntraUser = {
  username?: string | null
  displayName: string
  email: string | null
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