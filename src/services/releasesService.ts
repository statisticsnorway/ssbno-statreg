import { Release } from '@/generated/prisma/client'
import { prisma } from '../lib/prisma'

export async function getAllReleases(): Promise<Release[]> {
  return prisma.release.findMany()
}
