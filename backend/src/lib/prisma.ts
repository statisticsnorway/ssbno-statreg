import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import process from 'node:process'
import 'dotenv/config'
import { asyncLocalStorage } from './context'
import { getAllUsersFromCache } from './cache'
import { RevisionNames } from '@ssbno-statreg/shared'

export type Snapshot = Record<string, unknown> & { id?: number; version: number; date_created?: Date }

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
const fetchStatisticSnapshot = async (where: any): Promise<Snapshot | null> => {
  const statistic = await prisma.statistic.findUnique({
    where,
    include: {
      responsiblePersons: { select: { principalName: true } },
      variants: {
        select: {
          revision: true,
          level_of_detail: true,
          level_of_detail_en: true,
          cancelled: true,
          frequency: { select: { name: true } },
        },
      },
    },
  })

  if (!statistic) return null

  const users = await getAllUsersFromCache()
  const formattedResponsiblePersons = statistic.responsiblePersons
    .map((person) => person.principalName)
    .map((principalName) => `${principalName} (${users[principalName]?.displayName})`)
    .join(', ')

  //formatted example: "Uke (W), Ingen; Måned (M), Ingen, Detaljnivå, Detail level, Kansellert"
  const formattedVariants = statistic.variants
    .map((variant) => {
      const revisionCode = variant.revision as keyof typeof RevisionNames
      const revisionName = RevisionNames[revisionCode] ?? revisionCode
      const variantParts = [variant.frequency.name, revisionName]
      if (variant.level_of_detail) variantParts.push(variant.level_of_detail)
      if (variant.level_of_detail_en) variantParts.push(variant.level_of_detail_en)
      if (variant.cancelled) variantParts.push('Kansellert')
      return variantParts.join(', ')
    })
    .join('; ')

  return { ...statistic, responsiblePersons: formattedResponsiblePersons, variants: formattedVariants }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchCurrentSnapshot = async (args: { where: any }, model: string): Promise<Snapshot | null> => {
  switch (model) {
    case 'Variant':
      return prisma.variant.findUnique({ where: args.where })
    case 'Statistic':
      return fetchStatisticSnapshot(args.where)
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
      async createMany() {
        throw new Error('CreateMany is not supported by auditLog middleware!')
      },
      async createManyAndReturn() {
        throw new Error('CreateManyAndReturn is not supported by auditLog middleware!')
      },
      async update({ model, args, query }) {
        if (['Variant', 'Statistic', 'Release', 'Frequency', 'Calender_date'].includes(model)) {
          const start = new Date()
          const oldSnapshot = await fetchCurrentSnapshot(args, model)
          const incoming = await query(args)
          const newSnapshot = await fetchCurrentSnapshot(args, model)
          const store = asyncLocalStorage.getStore()
          const actor = store?.auth?.username || 'unknown'
          await prisma.auditLog.create({
            data: {
              actor,
              class_name: model,
              old_value: JSON.stringify(oldSnapshot),
              new_value: JSON.stringify(newSnapshot),
              last_updated: start,
              date_created: newSnapshot?.date_created ?? start,
              persisted_object_id: newSnapshot?.id || 0,
              persisted_object_version: newSnapshot?.version || 1,
              event_name: 'update',
            },
          })
          return incoming
        } else {
          return query(args)
        }
      },
      async updateMany() {
        throw new Error('UpdateMany is not supported by auditLog middleware!')
      },
      async updateManyAndReturn() {
        throw new Error('UpdateManyAndReturn is not supported by auditLog middleware!')
      },
      async delete({ model, args, query }) {
        if (['Variant', 'Statistic', 'Release', 'Frequency', 'Calender_date'].includes(model)) {
          const start = new Date()
          const oldSnapshot = await fetchCurrentSnapshot(args, model)
          const incoming = await query(args)
          const store = asyncLocalStorage.getStore()
          const actor = store?.auth?.username || 'unknown'
          await prisma.auditLog.create({
            data: {
              actor,
              class_name: model,
              old_value: JSON.stringify(incoming),
              new_value: null,
              date_created: oldSnapshot?.date_created ?? start,
              persisted_object_id: oldSnapshot?.id || 0,
              persisted_object_version: oldSnapshot?.version || 1,
              event_name: 'delete',
              last_updated: start,
            },
          })
          return incoming
        } else {
          return query(args)
        }
      },
      async deleteMany() {
        throw new Error('DeleteMany is not supported by auditLog middleware!')
      },
    },
  },
})

export type ExtendedPrismaClient = typeof extendedPrisma

export { extendedPrisma as prisma }
