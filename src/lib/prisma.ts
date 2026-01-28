import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'
import process from 'node:process'
import 'dotenv/config'
import * as fs from 'node:fs'

const adapter = new PrismaPg({
  connectionString: process.env.STATREG_DB_URL_CONNECTION_STRING!,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/var/run/secrets/nais.io/sqlcertificate/root-cert.pem', 'utf8'),
    key: fs.readFileSync('/var/run/secrets/nais.io/sqlcertificate/key.pem', 'utf8'),
    cert: fs.readFileSync('/var/run/secrets/nais.io/sqlcertificate/cert.pem', 'utf-8'),
  },
})

const prisma = new PrismaClient({ adapter })

export { prisma }
