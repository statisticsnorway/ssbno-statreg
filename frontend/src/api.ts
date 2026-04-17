import createFetchClient from 'openapi-fetch'
import createClient from 'openapi-react-query'
import type { paths } from '../../shared/api-types'

const fetchClient = createFetchClient<paths>({
  baseUrl: 'http://localhost:8080',
})

export const $api = createClient(fetchClient)
