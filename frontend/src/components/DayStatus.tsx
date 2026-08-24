import { Tag } from '@statisticsnorway/design-react'
import { DayStatus } from '@ssbno-statreg/shared'

const statusConfig = {
  BLOCKED: {
    color: 'neutral',
    text: DayStatus.BLOCKED,
  },
  FEW: {
    color: 'accent',
    text: DayStatus.FEW,
  },
  MANY: {
    color: 'warning',
    text: DayStatus.MANY,
  },
  FULL: {
    color: 'danger',
    text: DayStatus.FULL,
  },
} as const

export function DayStatusTag(props: { status: keyof typeof DayStatus }) {
  if (props.status == 'NONE') return null
  const config = statusConfig[props.status]
  return (
    <Tag aria-label={`Status publiseringer denne dagen`} data-color={config.color}>
      {config.text}
    </Tag>
  )
}
