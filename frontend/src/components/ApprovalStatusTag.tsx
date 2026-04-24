import { Tag } from '@digdir/designsystemet-react'
import { CheckmarkCircleIcon, ExclamationmarkTriangleIcon, ClockDashedIcon } from '@navikt/aksel-icons'
import { ApprovalStatus } from '@ssbno-statreg/shared'

const statusConfig = {
  PENDING: {
    color: 'warning' as const,
    text: 'Venter på godkjenning',
    icon: ExclamationmarkTriangleIcon,
  },
  ACCEPTED: {
    color: 'success' as const,
    text: 'Godkjent',
    icon: CheckmarkCircleIcon,
  },
  DECLINED: {
    color: 'neutral' as const,
    text: 'Utsatt',
    icon: ClockDashedIcon,
  },
}

export function ApprovalStatusTag({ status }: { status: keyof typeof ApprovalStatus }) {
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
