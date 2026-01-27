import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'
import process from 'node:process'
import 'dotenv/config'
import * as fs from 'node:fs'

const adapter = new PrismaPg({
  connectionString: process.env.STATREG_DB_URL_CONNECTION_STRING!,
  ssl: {
    rejectUnauthorized: false,
    ca: fs.readFileSync('/var/run/secrets/nais.io/sqlcertificate/root-cert.pem').toString(),
    key: fs.readFileSync('/var/run/secrets/nais.io/sqlcertificate/key.pem').toString(),
    cert: fs.readFileSync('/var/run/secrets/nais.io/sqlcertificate/cert.pem').toString(),
  },
})

const prisma = new PrismaClient({ adapter })

export { prisma }
