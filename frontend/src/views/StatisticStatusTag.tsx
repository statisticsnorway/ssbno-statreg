import { Tag } from '@digdir/designsystemet-react'

export const statisticStatusCodes = ['K', 'A', 'IA', 'UT', 'SA', 'SP'] as const

export type StatisticStatusCode = typeof statisticStatusCodes[number]

const statusConfig = {
  A: {
    color: 'success',
    text: 'Aktiv',
  },
  K: {
    color: 'neutral',
    text: 'Utkast',
  },
  IA: {
    color: 'danger',
    text: 'Ikke-aktiv',
  },
  UT: {
    color: 'danger',
    text: 'Opphørt',
  },
  SA: {
    color: 'warning',
    text: 'Sammenslått',
  },
  SP: {
    color: 'warning',
    text: 'Splittet',
  },
} as const

export function StatisticStatusTag({ status }: { status: StatisticStatusCode }) {
  const config = statusConfig[status]
  return (
    <Tag data-color={config.color}>
      {config.text}
    </Tag>
  )
}