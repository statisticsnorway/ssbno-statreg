export type CreatableStatisticStatus = 'K' | 'A'

export type CreateStatisticField =
  | 'shortname'
  | 'name'
  | 'name_en'
  | 'division'
  | 'main_language'
  | 'variants'
  | 'contacts'

export const requiredStatisticFieldsByStatus: Record<CreatableStatisticStatus, CreateStatisticField[]> = {
  K: ['shortname', 'name', 'division'],
  A: ['shortname', 'name', 'name_en', 'variants', 'contacts', 'division', 'main_language'],
}
