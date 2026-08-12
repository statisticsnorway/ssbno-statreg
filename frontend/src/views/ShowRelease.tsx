import { useState, useEffect } from 'react'
import { useParams, Link as ReactRouterLink } from 'react-router'
import { Heading, Link, Paragraph, Details, Card, Button, Spinner } from '@digdir/designsystemet-react'
import { PencilWritingIcon } from '@navikt/aksel-icons'
import { ApprovalStatusTag } from '../components/ApprovalStatus'
import client from '../api'
import { type ReleaseDetails, type Version } from '@ssbno-statreg/shared'
import { formatDateTime, formatDate, formatVariant } from '../lib/utils'
import { ErrorAlert } from '../components/ErrorAlert'
import { ChangeLogTable } from '../components/VersionTable'

function formatStatisticName(statistic: ReleaseDetails['statistic']): string {
  if (!statistic || !statistic.name || !statistic.shortname) return '-'
  return `${statistic.name} (${statistic.shortname})`
}

function formatPeriod(from?: string, to?: string): string {
  return `${formatDate(from)} – ${formatDate(to)}`
}

export default function ShowRelease() {
  const [release, setRelease] = useState<ReleaseDetails>({})
  const [versions, setVersions] = useState<Version[] | null>(null)
  const [isLoadingVersions, setIsLoadingVersions] = useState(false)
  const [apiError, setApiError] = useState<string[]>([])
  const { id } = useParams()

  useEffect(() => {
    async function fetchRelease() {
      const { data, error } = await client.GET('/releases/{id}', { params: { path: { id: id as string } } })

      if (error) {
        setApiError((prev) => [...prev, error.message])
        return
      }

      setRelease(data)
    }
    fetchRelease()
  }, [id])

  const approvalStatus = release.approval_status
  const statisticName = formatStatisticName(release.statistic)
  const period = formatPeriod(release.period_from, release.period_to)
  const publishTime = formatDateTime(release.publish_time)
  const variant = formatVariant(release.variant)

  async function fetchVersions() {
    if (!id || versions !== null || isLoadingVersions) return

    setIsLoadingVersions(true)

    const { data, error } = await client.GET('/releases/{id}/versions', {
      params: { path: { id: Number(id) } },
    })

    if (error) {
      setApiError((prev) => [...prev, error.message])
      setIsLoadingVersions(false)
      setVersions([])
      return
    }

    setVersions(data ?? [])
    setIsLoadingVersions(false)
  }

  return (
    <div className='show-release'>
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
            <Details.Summary onClick={fetchVersions}>Versjonshistorikk</Details.Summary>
            <Details.Content>
              {isLoadingVersions ? (
                <Spinner aria-label='Henter versjonshistorikk' />
              ) : (
                <ChangeLogTable versions={versions ?? []} />
              )}
            </Details.Content>
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
    </div>
  )
}
