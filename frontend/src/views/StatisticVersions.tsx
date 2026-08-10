import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Heading } from '@digdir/designsystemet-react'
import type { Version } from '@ssbno-statreg/shared'
import client from '../api'
import { ErrorAlert } from '../components/ErrorAlert'
import { ChangeLogTable } from '../components/VersionTable'

export default function StatisticVersions() {
  const { shortname } = useParams()
  const [versions, setVersions] = useState<Version[]>([])
  const [apiError, setApiError] = useState<string[]>([])

  useEffect(() => {
    if (!shortname) return
    const statisticShortname = shortname

    async function fetchVersions() {
      const { data, error } = await client.GET('/statistics/{shortname}/versions', {
        params: { path: { shortname: statisticShortname } },
      })

      if (error) {
        setApiError((prev) => [...prev, error.message])
        return
      }

      setVersions(data ?? [])
    }

    fetchVersions()
  }, [shortname])

  return (
    <section>
      {apiError.length > 0 && <ErrorAlert message={apiError} />}
      <Heading level={1} data-size='sm'>
        Versjonshistorikk
      </Heading>
      {/* TODO: get statistic name */}
      <p>Statistikknavn ({shortname ?? ''})</p>
      <ChangeLogTable versions={versions} />
    </section>
  )
}
