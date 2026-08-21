import type { components } from './api-types'
import { StatisticStatus } from './enums.js'

export type CreatableStatisticStatus = 'K' | 'A'
export type EditableStatisticStatus = keyof typeof StatisticStatus
type StatisticCreate = components['schemas']['Statistic_create']
type RequiredStatisticField = keyof StatisticCreate

export const requiredStatisticFieldsByStatus: Record<CreatableStatisticStatus, RequiredStatisticField[]> = {
  K: ['name', 'division'],
  A: ['name', 'name_en', 'variants', 'contacts', 'division'],
}

const requiredEditStatisticFieldsByStatus: Partial<Record<EditableStatisticStatus, RequiredStatisticField[]>> =
  requiredStatisticFieldsByStatus

export function getRequiredStatisticFields(status: CreatableStatisticStatus): RequiredStatisticField[] {
  return requiredStatisticFieldsByStatus[status]
}

export function getRequiredEditStatisticFields(status: EditableStatisticStatus): RequiredStatisticField[] {
  return requiredEditStatisticFieldsByStatus[status] ?? []
}

export function isCreateStatisticFieldRequired(
  status: CreatableStatisticStatus,
  field: RequiredStatisticField
): boolean {
  return requiredStatisticFieldsByStatus[status].includes(field)
}

export function isEditStatisticFieldRequired(status: EditableStatisticStatus, field: RequiredStatisticField): boolean {
  return getRequiredEditStatisticFields(status).includes(field)
}
