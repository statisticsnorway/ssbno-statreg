import { Tag, Badge } from '@digdir/designsystemet-react'
import { CheckmarkCircleIcon, ExclamationmarkTriangleIcon, ClockDashedIcon } from '@navikt/aksel-icons'
import { ApprovalStatus } from '@ssbno-statreg/shared'

const statusConfig = {
  PENDING: {
    color: 'warning' as const,
    text: 'Forslag til godkjenning',
    icon: ExclamationmarkTriangleIcon,
  },
  ACCEPTED: {
    color: 'success' as const,
    text: 'Godkjent',
    icon: CheckmarkCircleIcon,
  },
  DELAYED: {
    color: 'neutral' as const,
    text: 'Utsatt',
    icon: ClockDashedIcon,
  },
  DECLINED: {
    color: 'danger' as const,
    text: 'Avvist',
    icon: ClockDashedIcon,
  },
}

function parseApprovalStatus(status?: string | null): keyof typeof ApprovalStatus {
  for (const keyString of Object.keys(ApprovalStatus)) {
    const key = keyString as keyof typeof ApprovalStatus
    if (ApprovalStatus[key] === status) return key
  }
  return 'PENDING'
}

export function ApprovalStatusTag(props: { status?: string | null }) {
  const parsedStatus = parseApprovalStatus(props.status)
  const config = statusConfig[parsedStatus]
  const Icon = config.icon
  return (
    <Tag data-color={config.color} style={{ paddingInlineStart: 'var(--ds-size-1)' }}>
      <Icon aria-hidden style={{ marginInlineEnd: 'var(--ds-size-1)' }} />
      {config.text}
    </Tag>
  )
}

export function ApprovalStatusBadge(props: { status?: string | null }) {
  const parsedStatus = parseApprovalStatus(props.status)
  const config = statusConfig[parsedStatus]
  return (
    <>
      <Badge data-color={config.color} /> {config.text.split(' ')[0]}
    </>
  )
}
