export const ApprovalStatus = {
  ACCEPTED: 'GODKJENT',
  PENDING: 'FORSLAG',
  DECLINED: 'AVVIST',
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
