import { Tag } from '@digdir/designsystemet-react'
import { CheckmarkCircleIcon, ExclamationmarkTriangleIcon, ClockDashedIcon } from '@navikt/aksel-icons'
import { ApprovalStatus } from '@ssbno-statreg/shared'

const statusConfig = {
  [ApprovalStatus.PENDING]: {
    color: 'warning' as const,
    text: 'Venter på godkjenning',
    icon: ExclamationmarkTriangleIcon,
  },
  [ApprovalStatus.ACCEPTED]: {
    color: 'success' as const,
    text: 'Godkjent',
    icon: CheckmarkCircleIcon,
  },
  [ApprovalStatus.DECLINED]: {
    color: 'neutral' as const,
    text: 'Utsatt',
    icon: ClockDashedIcon,
  },
}

export function ApprovalStatusTag({ status }: { status: ApprovalStatus }) {
  const config = statusConfig[status]
  const Icon = config.icon
  return (
    <Tag
      data-color={config.color}
      style={{ paddingInlineStart: 'var(--ds-size-1)' }}
    >
      <Icon aria-hidden style={{ marginInlineEnd: 'var(--ds-size-1)' }} />
      {config.text}
    </Tag>
  )
}
