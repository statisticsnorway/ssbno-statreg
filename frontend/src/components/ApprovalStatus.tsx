import { Tag, Badge } from '@digdir/designsystemet-react'
import { CheckmarkCircleIcon, ExclamationmarkTriangleIcon, ClockDashedIcon } from '@navikt/aksel-icons'

// TODO ApprovalStatus should be imported from shared, but needs more setup
export const ApprovalStatus  = {
  ACCEPTED: 'GODKJENT',
  PENDING: 'FORSLAG',
  DECLINED: 'AVVIST',
} as const

export type ApprovalStatus = typeof ApprovalStatus[keyof typeof ApprovalStatus]

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

function parseApprovalStatus(status?: string | null): ApprovalStatus | null {
  const validStatuses = Object.values(ApprovalStatus) as string[]
  if (!status || !validStatuses.includes(status)) return null
  return status as ApprovalStatus
}

export function ApprovalStatusTag(props: { status?: string | null }) {
  const parsedStatus = parseApprovalStatus(props.status) as ApprovalStatus
  const config = statusConfig[parsedStatus]
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

export function ApprovalStatusBadge(props: { status?: string | null }) {
  const parsedStatus = parseApprovalStatus(props.status) as ApprovalStatus
  const config = statusConfig[parsedStatus]
  return (
    <>
      <Badge data-color={config.color}/> {config.text.split(' ')[0]}
    </>
  )
}
