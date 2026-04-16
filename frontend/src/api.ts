import createClient from 'openapi-fetch'
import type { paths } from '../../shared/api-types'

const client = createClient<paths>({ baseUrl: 'http://localhost:8080' })

export default client
