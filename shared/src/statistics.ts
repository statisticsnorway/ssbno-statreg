import { type StatisticCreate } from '.'
import { StatisticStatus } from './enums.js'

export type CreatableStatisticStatus = 'K' | 'A'
export type EditableStatisticStatus = keyof typeof StatisticStatus
type RequiredStatisticField = keyof StatisticCreate

export const RequiredCreateStatisticFieldsByStatus: Record<CreatableStatisticStatus, RequiredStatisticField[]> = {
  K: ['name', 'division'],
  A: ['name', 'name_en', 'variants', 'contacts', 'division'],
}

export const RequiredEditStatisticFieldsByStatus: Partial<Record<EditableStatisticStatus, RequiredStatisticField[]>> =
  RequiredCreateStatisticFieldsByStatus

export function isCreateStatisticFieldRequired(
  status: CreatableStatisticStatus,
  field: RequiredStatisticField
): boolean {
  return RequiredCreateStatisticFieldsByStatus[status].includes(field)
}

export function isEditStatisticFieldRequired(status: EditableStatisticStatus, field: RequiredStatisticField): boolean {
  return RequiredEditStatisticFieldsByStatus[status]?.includes(field) ?? false
}
