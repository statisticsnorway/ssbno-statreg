import createClient from 'openapi-fetch'
import type { paths } from '../../shared/src/api-types'
import { BASE_ROUTE } from './main'

const client = createClient<paths>({ baseUrl: BASE_ROUTE })

export default client
