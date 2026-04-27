import { Tag } from '@digdir/designsystemet-react'
import{StatisticStatus} from '@ssbno-statreg/shared'

const StatusAttributes = {
  A: {
    color: 'success',
    text: StatisticStatus.A,
  },
  K: {
    color: 'neutral',
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
