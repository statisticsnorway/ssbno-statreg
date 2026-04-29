import { useState, useEffect } from 'react'
import { Heading, Paragraph, Tabs } from '@digdir/designsystemet-react'
import { CalendarIcon } from '@navikt/aksel-icons'
import { type ReleaseListing } from '@ssbno-statreg/shared'

import { formatDate } from '../lib/utils'
import { ReleasesTable } from '../components/ReleasesTable'
import { ApprovalStatusTag } from '../components/ApprovalStatus'

import client from '../api'

export default function CreateRelease() {
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [variantReleases, setVariantReleases] = useState<ReleaseListing[]>([])

  useEffect(() => {
    async function fetchReleases() {
      const { data, error } = await client.GET('/releases', { params: { query: { start: 0, count: 20 } } })
      if (error) {
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setReleases(data?.releases ?? [])
      }
    }
    fetchReleases()

    async function fetchVariantRelease() {
      const { data, error } = await client.GET('/statistics/{shortname}/variants/{id}/releases', {
        params: { path: { shortname: 'utlaerling', id: 9024 } },
      })
      if (error) {
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setVariantReleases(data?.releases ?? [])
      }
    }
    fetchVariantRelease()
  }, [])

  const variantRelease = Object.entries(variantReleases).map(([__, variantRelease]) => variantRelease)[0]
  const statisticName = variantRelease?.statistic?.name ?? ''
  const statisticShortname = variantRelease?.statistic?.shortname ?? ''
  const variant = variantRelease?.frequency?.name ?? ''
  const approvalStatus = variantRelease?.approval_status ?? ''

  function renderReleasesTables() {
    return (
      <Tabs defaultValue='selected-publish-date' style={{ width: '100%', rowGap: 'var(--ds-size-10)' }}>
        <Tabs.List style={{ marginBottom: 'var(--ds-size-10)' }}>
          <Tabs.Tab value='selected-publish-date'>
            <CalendarIcon />
            Publiseringer på valgt dato
          </Tabs.Tab>
          <Tabs.Tab value='variant-releases'>
            Alle publiseringer på {statisticShortname}, {variant}
          </Tabs.Tab>
        </Tabs.List>
        {/* TODO: Padding can be set with classes instead of inline-css */}
        <Tabs.Panel style={{ padding: '0' }} value='selected-publish-date'>
          {/* TODO: Placeholder date */}
          <Paragraph>
            Innmeldte datoer den {formatDate(Object.entries(releases).map(([__, release]) => release)[0]?.publish_time)}
          </Paragraph>
          <ReleasesTable releases={releases} />
        </Tabs.Panel>
        <Tabs.Panel style={{ padding: '0' }} value='variant-releases'>
          <ReleasesTable releases={variantReleases} />
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
