import { useState, useEffect } from 'react'
import { Heading, Link, Paragraph, Details, Card, Button } from '@digdir/designsystemet-react'
import { PencilWritingIcon } from '@navikt/aksel-icons'
import { ApprovalStatusTag, ApprovalStatus } from './ApprovalStatusTag'
import client from '../api'
import { type ReleaseDetails } from '@ssbno-statreg/shared'

function ReleaseDetail() {
  const [release, setReleases] = useState<ReleaseDetails>({})

  useEffect(() => {
    async function fetchRelease() {
      const { data, error } = await client.GET('/releases/{id}', { params: { path: { id: '4' } } })
      if (error) {
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setReleases(data)
      }
    }
    fetchRelease()
  }, [])

  const approvalStatus = parseApprovalStatus(release.approval_status)
  const statisticName = formatStatisticName(release.statistic)
  const period = formatPeriod(release.period_from, release.period_to)
  const publishTime = formatPublishTime(release.publish_time)
  const variant = formatVariant(release.variant)

  return (
    <>
      <div>
        <Heading data-size='md' level={1}>
          Publiseringsdato
        </Heading>
        <Heading data-size='xs'>{publishTime}</Heading>
        {approvalStatus && <ApprovalStatusTag status={approvalStatus} />}
      </div>
      <div>
        <Heading data-size='xs'>Statistikk</Heading>
        <Link href='#'>{statisticName}</Link>
        {/* TODO link should point to the statistic page, routing must be implemented first */}
      </div>
      <div>
        <Heading data-size='xs'>Variant</Heading>
        <Paragraph>{variant}</Paragraph>
      </div>
      <div>
        <Heading data-size='xs'>Måleperiode</Heading>
        <Paragraph>{period}</Paragraph>
      </div>
      <div>
        <Card>
          <Details>
            <Details.Summary>Versjonshistorikk</Details.Summary>
            <Details.Content>Kommmer snart.</Details.Content>
          </Details>
        </Card>
      </div>
      <div>
        <Button onClick={() => alert('Redigering er ikke implementert ennå.')} data-size='sm' variant='tertiary'>
          <PencilWritingIcon aria-hidden /> Rediger
        </Button>
      </div>
    </>
  )
}

function parseApprovalStatus(status?: string | null): ApprovalStatus | null {
  const validStatuses = Object.values(ApprovalStatus) as string[]
  if (!status || !validStatuses.includes(status)) return null
  return status as ApprovalStatus
}

function formatStatisticName(statistic: ReleaseDetails['statistic']): string {
  if (!statistic || !statistic.name || !statistic.shortname) return '-'
  return `${statistic.name} (${statistic.shortname})`
}

function formatPublishTime(publishTime: string | undefined): string {
  if (!publishTime) return '-'
  return new Date(publishTime)
    .toLocaleString('nb-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(',', ' kl')
}

function formatPeriod(from?: string, to?: string): string {
  return `${formatDate(from)} – ${formatDate(to)}`
}

function formatDate(isoString?: string): string {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatVariant(variant?: ReleaseDetails['variant']): string {
  const frequency = variant?.frequency?.name ?? '-'
  const revision = formatRevisionName(variant?.revision?.name)
  return `${frequency}, ${revision}`
}

function formatRevisionName(revision?: string): string {
  if (!revision || !(revision in revisionNames)) return '-'
  return revisionNames[revision]
}

const revisionNames: Record<string, string> = {
  I: 'Ingen',
  B: 'Beregnede',
  E: 'Endelige',
  F: 'Foreløpige',
  R: 'Reviderte',
  IG: 'Integrert',
}

export default ReleaseDetail
