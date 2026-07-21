export type CreatableStatisticStatus = 'K' | 'A'

export const requiredStatisticFieldsByStatus = {
  K: ['name', 'division'],
  A: ['name', 'name_en', 'variants', 'contacts', 'division', 'main_language'],
} as const
