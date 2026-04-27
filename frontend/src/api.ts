import createClient from 'openapi-fetch'
import type { paths } from '../../shared/src/api-types'

const client = createClient<paths>({ baseUrl: '/statistikkregisteret/api' })

export default client
