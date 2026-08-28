import { Tag, Badge } from '@statisticsnorway/design-react'
import { StatisticStatus } from '@ssbno-statreg/shared'

const StatusAttributes = {
  A: {
    color: 'success',
    text: StatisticStatus.A,
  },
  K: {
    color: 'info',
    text: StatisticStatus.K,
  },
  IA: {
    color: 'danger',
    text: StatisticStatus.IA,
  },
  UT: {
    color: 'danger',
    text: StatisticStatus.UT,
  },
  SA: {
    color: 'warning',
    text: StatisticStatus.SA,
  },
  SP: {
    color: 'warning',
    text: StatisticStatus.SP,
  },
} as const

export function StatisticStatusTag({ status }: { status: keyof typeof StatusAttributes }) {
  const config = StatusAttributes[status]
  return (
    <Tag aria-label={`Status`} data-color={config.color}>
      {config.text}
    </Tag>
  )
}

export function StatisticStatusBadge(props: { status?: string | null }) {
  const config = StatusAttributes[props.status as keyof typeof StatusAttributes]
  return (
    <span aria-label={`Status`}>
      <Badge aria-hidden data-color={config.color} /> {config.text}
    </span>
  )
}
