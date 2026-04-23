import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { Heading, Link, Paragraph, Details, Card, Button } from '@digdir/designsystemet-react'
import { PencilWritingIcon } from '@navikt/aksel-icons'
import { ApprovalStatusTag } from './ApprovalStatusTag'
import client from '../api'
import { type ReleaseDetails } from '@ssbno-statreg/shared'

import { parseApprovalStatus, formatPublishTime, formatDate } from '../lib/utils'

function ReleaseDetail() {
  const [release, setReleases] = useState<ReleaseDetails>({})
  const { id } = useParams()

  useEffect(() => {
    async function fetchRelease() {
      const { data, error } = await client.GET('/releases/{id}', { params: { path: { id: id as string } } })
      if (error) {
        console.log(error)
        alert(error)
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
            <Details.Content>Kommer snart.</Details.Content>
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

function formatStatisticName(statistic: ReleaseDetails['statistic']): string {
  if (!statistic || !statistic.name || !statistic.shortname) return '-'
  return `${statistic.name} (${statistic.shortname})`
}

function formatPeriod(from?: string, to?: string): string {
  return `${formatDate(from)} – ${formatDate(to)}`
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
