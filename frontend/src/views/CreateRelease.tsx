import { useState, useEffect } from 'react'
import { Heading, Tabs } from '@digdir/designsystemet-react'
import { CalendarIcon } from '@navikt/aksel-icons'
import { type ReleaseListing } from '@ssbno-statreg/shared'

import { ReleasesTable } from '../components/ReleasesTable'
import { ApprovalStatusTag } from '../components/ApprovalStatus'

import client from '../api'

export default function CreateRelease() {
  const [releases, setReleases] = useState<ReleaseListing[]>([])

  useEffect(() => {
    async function fetchRelease() {
      const { data, error } = await client.GET('/statistics/{shortname}/variants/{id}/releases', {
        params: { path: { shortname: 'utlaerling', id: 9024 } },
      })
      if (error) {
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setReleases(data?.releases ?? [])
      }
    }
    fetchRelease()
  }, [])

  const release = Object.entries(releases).map(([__, release]) => release)[0]
  const statisticName = release?.statistic?.name ?? ''
  const statisticShortname = release?.statistic?.shortname ?? ''
  const variant = release?.frequency?.name ?? ''
  const approvalStatus = release?.approval_status ?? ''

  function renderReleasesTables() {
    return (
      <Tabs defaultValue='selected-publish-date' style={{ width: '100%', rowGap: 'var(--ds-size-10)' }}>
        <Tabs.List style={{ marginBottom: 'var(--ds-size-10)' }}>
          <Tabs.Tab value='selected-publish-date'>
            <CalendarIcon />
            Publiseringer på valgt dato
          </Tabs.Tab>
          <Tabs.Tab value='all-releases'>
            Alle publiseringer på {statisticShortname}, {variant}
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel style={{ padding: '0' }} value='selected-publish-date'>
          {' '}
          {/* TODO: Padding can be set with classes instead of inline-css */}
          Innmeldte datoer den ...
        </Tabs.Panel>
        <Tabs.Panel style={{ padding: '0' }} value='all-releases'>
          <ReleasesTable releases={releases} /> {/* TODO: Include pagination and x row selection to component */}
        </Tabs.Panel>
      </Tabs>
    )
  }

  return (
    <>
      <div>
        <Heading level={1} data-size='md'>
          Meld publiseringsdato
        </Heading>
        {statisticName && statisticShortname && variant && (
          <Heading level={2} data-size='xs'>
            {statisticName} ({statisticShortname}) og {variant}
          </Heading>
        )}
        {approvalStatus && <ApprovalStatusTag status={approvalStatus} />}
      </div>
      {renderReleasesTables()}
    </>
  )
}
