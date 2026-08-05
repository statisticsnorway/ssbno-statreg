export const ApprovalStatus = {
  ACCEPTED: 'GODKJENT',
  PENDING: 'FORSLAG',
  DECLINED: 'AVVIST',
  DELAYED: 'UTSATT',
} as const

export const StatisticStatus = {
  K: 'Kommende',
  A: 'Aktiv',
  IA: 'Ikke-aktiv',
  UT: 'Opphørt',
  SA: 'Sammenslått',
  SP: 'Splittet',
} as const

export const RevisionNames = {
  I: 'Ingen',
  B: 'Beregnede',
  E: 'Endelige',
  F: 'Foreløpige',
  R: 'Reviderte',
  IG: 'Integrert',
} as const

// TODO: Burde hentes fra api endepunkt
export const FrequencyNames = {
  U: 'Uke',
  M: 'Måned',
  K: 'Kvartal',
  H: 'Halvår',
  A: 'År',
  '2A': 'Hvert 2 år',
  '3A': 'Hvert 3 år',
  '4A': 'Hvert 4 år',
  '5A': 'Hvert 5 år',
  '10A': 'Hvert 10 år',
  T: 'Termin',
} as const

export const DayStatus = {
  BLOCKED: 'Sperret',
  NONE: 'Ledig',
  FEW: 'Noen',
  MANY: 'Begrenset',
  FULL: 'Fullt',
}
