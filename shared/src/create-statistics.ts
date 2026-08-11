import { type StatisticCreate } from '.'

export type CreatableStatisticStatus = 'K' | 'A'
type RequiredStatisticField = keyof StatisticCreate

export const requiredStatisticFieldsByStatus: Record<CreatableStatisticStatus, RequiredStatisticField[]> = {
  K: ['name', 'division'],
  A: ['name', 'name_en', 'variants', 'contacts', 'division'],
}

export function getRequiredStatisticFields(status: CreatableStatisticStatus): RequiredStatisticField[] {
  return requiredStatisticFieldsByStatus[status]
}

export function isCreateStatisticFieldRequired(
  status: CreatableStatisticStatus,
  field: RequiredStatisticField
): boolean {
  return requiredStatisticFieldsByStatus[status].includes(field)
}
