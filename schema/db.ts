import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'cob',
  password: process.env.DB_PASSWORD || 'changeme',
  database: process.env.DB_NAME || 'statregdb',
  connectionTimeoutMillis: 5000,
})

export default pool
