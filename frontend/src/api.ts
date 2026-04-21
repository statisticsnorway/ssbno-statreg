import createClient from 'openapi-fetch'
import type { paths } from '../../shared/src/api-types'

// TODO: Use BASE_URL instead; somehow it doesn't quite work
const client = createClient<paths>({ baseUrl: '/statistikkregisteret/api' })

export default client
