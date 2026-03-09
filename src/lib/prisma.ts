import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import process from 'node:process'
import 'dotenv/config'

export type Snapshot = object & { id?: number; date_created?: Date }

const adapter = new PrismaPg({
  connectionString: process.env.PGURL!,
  // SSL settings need to be disabled for local development
  ssl:
    process.env.NODE_ENV === 'development'
      ? undefined
      : {
          rejectUnauthorized: false,
        },
})

const prisma = new PrismaClient({ adapter })

const fetchCurrentSnapshot = async (
  id: number,
  model: 'Variant' | 'Statistic' | 'Release' | 'Frequency' | 'Calender_date'
): Promise<Snapshot | null> => {
  switch (model) {
    case 'Variant':
      return prisma.variant.findUnique({ where: { id } })
    case 'Statistic':
      return prisma.statistic.findUnique({ where: { id } })
    case 'Release':
      return prisma.release.findUnique({ where: { id } })
    case 'Frequency':
      return prisma.frequency.findUnique({ where: { id } })
    case 'Calender_date':
      return prisma.calender_date.findUnique({ where: { id } })
    default:
      return null
  }
}

const extendedPrisma = prisma.$extends({
  name: 'audit-extension',
  query: {
    $allModels: {
      async create({ model, args, query }) {
        if (['Variant', 'Statistic', 'Release', 'Frequency', 'Calender_date'].includes(model)) {
          const start = new Date()
          const incoming = await query(args)
          await prisma.auditLogOld.create({
            data: {
              actor: 'test1',
              class_name: model,
              last_updated: start,
              date_created: start,
              new_value: JSON.stringify(incoming),
              old_value: null,
              persisted_object_id: (incoming as { id?: number }).id || 0,
              event_name: 'create',
            },
          })
          // console.log(`AUDIT LOG at ${start} performing CREATE on ${model}: ${JSON.stringify(args, null, 2)}`)
          return incoming
        } else {
          return query(args)
        }
      },
      async update({ model, args, query }) {
        if (['Variant', 'Statistic', 'Release', 'Frequency', 'Calender_date'].includes(model)) {
          const start = new Date()
          const existing = await fetchCurrentSnapshot(args.where.id, model)
          const incoming = await query(args)
          await prisma.auditLogOld.create({
            data: {
              actor: 'test2',
              class_name: model,
              old_value: JSON.stringify(existing),
              new_value: JSON.stringify(incoming),
              last_updated: start,
              date_created: existing?.date_created ?? start,
              persisted_object_id: (incoming as { id?: number }).id || 0,
              event_name: 'update',
            },
          })
          return incoming
        } else {
          return query(args)
        }
      },
    },
  },
})

export type ExtendedPrismaClient = typeof extendedPrisma

export { extendedPrisma as prisma }
