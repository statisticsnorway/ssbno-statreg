import { useState, useEffect } from 'react'
import { useParams, Link as ReactRouterLink } from 'react-router'
import { Heading, Link, Paragraph, Details, Card, Button } from '@digdir/designsystemet-react'
import { PencilWritingIcon } from '@navikt/aksel-icons'
import { ApprovalStatusTag } from '../components/ApprovalStatus'
import client from '../api'
import { type ReleaseDetails } from '@ssbno-statreg/shared'
import { formatPublishTime, formatDate, formatVariant } from '../lib/utils'
import { ErrorAlert } from '../components/ErrorAlert'

function formatStatisticName(statistic: ReleaseDetails['statistic']): string {
  if (!statistic || !statistic.name || !statistic.shortname) return '-'
  return `${statistic.name} (${statistic.shortname})`
}

function formatPeriod(from?: string, to?: string): string {
  return `${formatDate(from)} – ${formatDate(to)}`
}

export default function ShowRelease() {
  const [release, setRelease] = useState<ReleaseDetails>({})
  const [apiError, setApiError] = useState<string[]>([])
  const { id } = useParams()

  useEffect(() => {
    async function fetchRelease() {
      const { data, error } = await client.GET('/releases/{id}', { params: { path: { id: id as string } } })

      if (error) {
        setApiError((prev) => [...prev, error.error])
        return
      }

      setRelease(data)
    }
    fetchRelease()
  }, [id])

  const approvalStatus = release.approval_status
  const statisticName = formatStatisticName(release.statistic)
  const period = formatPeriod(release.period_from, release.period_to)
  const publishTime = formatPublishTime(release.publish_time)
  const variant = formatVariant(release.variant)

  return (
    <>
      {apiError.length > 0 && <ErrorAlert message={apiError} />}
      <div>
        <Heading data-size='md' level={1}>
          Publiseringsdato
        </Heading>
        <Heading data-size='xs'>{publishTime}</Heading>
        {approvalStatus && <ApprovalStatusTag status={approvalStatus} />}
      </div>
      <div>
        <Heading data-size='xs'>Statistikk</Heading>
        <Link href={`/statistikkregisteret/statistikk/${release.statistic?.shortname}`}>{statisticName}</Link>
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
        <Button asChild data-size='sm' variant='tertiary'>
          <ReactRouterLink to={`/publisering/${id}/rediger`}>
            <PencilWritingIcon aria-hidden /> Rediger
          </ReactRouterLink>
        </Button>
      </div>
    </>
  )
}
