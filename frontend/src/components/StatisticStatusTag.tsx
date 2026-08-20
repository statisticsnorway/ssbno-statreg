import { Tag } from '@statisticsnorway/design-react'
import { StatisticStatus } from '@ssbno-statreg/shared'
import { Badge } from '@statisticsnorway/design-react'

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
  return <Tag data-color={config.color}>{config.text}</Tag>
}

export function StatisticStatusBadge(props: { status?: string | null }) {
  const config = StatusAttributes[props.status as keyof typeof StatusAttributes]
  return (
    <>
      <Badge data-color={config.color} /> {config.text}
    </>
  )
}
