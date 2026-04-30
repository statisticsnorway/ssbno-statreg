import { Tag } from '@digdir/designsystemet-react'
import { DayStatus } from '@ssbno-statreg/shared'

export type VisibleDayStatus = Exclude<DayStatusValue, typeof DayStatus.NONE>

type DayStatusValue = typeof DayStatus[keyof typeof DayStatus]

type StatusConfig = {
  color: 'neutral' | 'accent' | 'warning' | 'danger'
  text: DayStatusValue
}

const statusConfig: Record<VisibleDayStatus, StatusConfig> = {
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
}

export function DayStatusTag(props: { status: VisibleDayStatus }) {
  const config: StatusConfig = statusConfig[props.status]
  return (
    <Tag data-color={config.color}>
      {config.text}
    </Tag>
  )
}