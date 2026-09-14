import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Heading, Link, Paragraph } from '@statisticsnorway/design-react'
import type { Version } from '@ssbno-statreg/shared'
import client from '../api'
import { ErrorAlert } from '../components/ErrorAlert'
import { ChangeLogTable } from '../components/VersionTable'
import ErrorPage, { ErrorType } from './ErrorPage'

export default function StatisticVersions() {
  const { shortname } = useParams()
  const [versions, setVersions] = useState<Version[]>([])
  const [statisticName, setStatisticName] = useState('')
  const [apiError, setApiError] = useState<string[]>([])
  const [invalidShortname, setInvalidShortname] = useState(false)

  useEffect(() => {
    if (!shortname) return
    const statisticShortname = shortname

    async function initializeStatisticVersions() {
      setApiError([])
      setInvalidShortname(false)

      const {
        data: shortnameData,
        error: shortnameError,
        response: shortnameResponse,
      } = await client.GET('/shortnames/{shortname}', {
        params: { path: { shortname: statisticShortname } },
      })

      if (shortnameError) {
        if (shortnameResponse.status === 404) {
          setInvalidShortname(true)
          setApiError([shortnameError.message])
          return
        }

        setApiError([shortnameError.message])
        return
      }

      setStatisticName(shortnameData.statistic_name ?? '')

      const { data, error } = await client.GET('/statistics/{shortname}/versions', {
        params: { path: { shortname: statisticShortname } },
      })

      if (error) {
        setApiError((prev) => [...prev, error.message])
        return
      }

      setVersions(data ?? [])
    }

    initializeStatisticVersions()
  }, [shortname])

  if (invalidShortname) return <ErrorPage type={ErrorType.NOTFOUND} />

  return (
    <>
      {apiError.length > 0 && <ErrorAlert message={apiError} />}
      <Link href={`/statistikkregisteret/statistikk/${shortname}`}>{`← Tilbake til (${shortname})`}</Link>

      <div>
        <Heading level={1}>Versjonshistorikk</Heading>
        <Paragraph variant='short'>
          {statisticName} ({shortname ?? ''})
        </Paragraph>
      </div>

      <ChangeLogTable versions={versions} />
    </>
  )
}
