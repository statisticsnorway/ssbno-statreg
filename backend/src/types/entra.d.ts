
export type TokenResponse = {
  access_token: string
  expires_in: number
}

export type GraphUsersResponse = {
  value: EntraUser[]
  '@odata.nextLink'?: string
}

export type EntraUser = {
  displayName: string
  mail: string  | null
  userPrincipalName: string
  businessPhones: string[] | null
}

export type Users = { 
  username: string | null
}