
export type TokenResponse = {
  access_token: string
  expires_in: number
}

type GraphUserResponse = {
  displayName: string
  businessPhones: string | null
  mail: string | null
  userPrincipalName: string
}

export type GraphUsersResponse = {
  value: GraphUserResponse[]
  '@odata.nextLink'?: string
}

export type EntraUser = {
  displayName: string
  email: string  | null
  userPrincipalName: string
  businessPhone: string | null
}

export type Users = { 
  username: string | null
}