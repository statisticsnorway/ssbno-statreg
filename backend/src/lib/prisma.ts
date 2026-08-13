import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import process from 'node:process'
import 'dotenv/config'
import { asyncLocalStorage } from './context'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchCurrentSnapshot = async (args: { where: any }, model: string): Promise<Snapshot | null> => {
  switch (model) {
    case 'Variant':
      return prisma.variant.findUnique({ where: args.where })
    case 'Statistic':
      return prisma.statistic.findUnique({ where: args.where })
    case 'Release':
      return prisma.release.findUnique({ where: args.where })
    case 'Frequency':
      return prisma.frequency.findUnique({ where: args.where })
    case 'Calender_date':
      return prisma.calender_date.findUnique({ where: args.where })
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
          const store = asyncLocalStorage.getStore()
          const actor = store?.auth?.username || 'unknown'
          await prisma.auditLog.create({
            data: {
              actor,
              class_name: model,
              last_updated: start,
              date_created: start,
              new_value: JSON.stringify(incoming),
              old_value: null,
              persisted_object_id: (incoming as { id?: number }).id || 0,
              persisted_object_version: (incoming as { version?: number }).version || 1,
              event_name: 'create',
            },
          })
          return incoming
        } else {
          return await query(args)
        }
      },
      // We can comment out these three overrides on create, update and delete Many. We need them for data migration. We can not implement audit logging on these functions and they must be disabled in our project.
      // async createMany() {
      //   throw new Error('CreateMany is not supported by auditLog middleware!')
      // },
      async createManyAndReturn() {
        throw new Error('CreateManyAndReturn is not supported by auditLog middleware!')
      },
      async update({ model, args, query }) {
        if (['Variant', 'Statistic', 'Release', 'Frequency', 'Calender_date'].includes(model)) {
          const start = new Date()
          const existing = await fetchCurrentSnapshot(args, model)
          const incoming = await query(args)
          const store = asyncLocalStorage.getStore()
          const actor = store?.auth?.username || 'unknown'
          await prisma.auditLog.create({
            data: {
              actor,
              class_name: model,
              old_value: JSON.stringify(existing),
              new_value: JSON.stringify(incoming),
              last_updated: start,
              date_created: existing?.date_created ?? start,
              persisted_object_id: (incoming as { id?: number }).id || 0,
              persisted_object_version: (incoming as { version?: number }).version || 1,
              event_name: 'update',
            },
          })
          return incoming
        } else {
          return query(args)
        }
      },
      // async updateMany() {
      //   throw new Error('UpdateMany is not supported by auditLog middleware!')
      // },
      async updateManyAndReturn() {
        throw new Error('UpdateManyAndReturn is not supported by auditLog middleware!')
      },
      async delete({ model, args, query }) {
        if (['Variant', 'Statistic', 'Release', 'Frequency', 'Calender_date'].includes(model)) {
          const start = new Date()
          const incoming = await query(args)
          const store = asyncLocalStorage.getStore()
          const actor = store?.auth?.username || 'unknown'
          await prisma.auditLog.create({
            data: {
              actor,
              class_name: model,
              old_value: JSON.stringify(incoming),
              new_value: null,
              date_created: (incoming as { date_created?: Date }).date_created ?? '',
              persisted_object_id: (incoming as { id?: number }).id || 0,
              persisted_object_version: (incoming as { version?: number }).version || 1,
              event_name: 'delete',
              last_updated: start,
            },
          })
          return incoming
        } else {
          return query(args)
        }
      },
      // async deleteMany() {
      //   throw new Error('DeleteMany is not supported by auditLog middleware!')
      // },
    },
  },
})

export type ExtendedPrismaClient = typeof extendedPrisma

export { extendedPrisma as prisma }
