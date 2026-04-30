import { useState, useEffect } from 'react'
import { Heading, Paragraph, Tabs } from '@digdir/designsystemet-react'
import { CalendarIcon } from '@navikt/aksel-icons'
import { type ReleaseListing } from '@ssbno-statreg/shared'

import { formatDate } from '../lib/utils'
import { ReleasesTable } from '../components/ReleasesTable'
import { Test } from './Test'

import client from '../api'

export default function CreateRelease() {
  const [releases, setReleases] = useState<ReleaseListing[]>([])

  useEffect(() => {
    async function fetchReleases() {
      const { data, error } = await client.GET('/releases', { params: { query: { start: 0, count: 10 } } })
      if (error) {
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setReleases(data?.releases ?? [])
      }
    }
    fetchReleases()
  })

  function renderReleasesTables() {
    return (
      <Tabs defaultValue='selected-publish-date' style={{ width: '100%', rowGap: 'var(--ds-size-10)' }}>
        <Tabs.List style={{ marginBottom: 'var(--ds-size-10)' }}>
          <Tabs.Tab value='selected-publish-date'>
            <CalendarIcon />
            Publiseringer på valgt dato
          </Tabs.Tab>
          <Tabs.Tab value='variant-releases'>
            Alle publiseringer på "kortnavn", "variant" {/* TODO: MIM-2664: Implement on variant releases list table view */}
          </Tabs.Tab>
        </Tabs.List>
        {/* TODO: Padding can be set with classes instead of inline-css */}
        <Tabs.Panel style={{ padding: '0' }} value='selected-publish-date'>
          {/* TODO: Placeholder date */}
          <Paragraph>
            Innmeldte datoer den {formatDate(releases[0]?.publish_time)}
          </Paragraph>
          <ReleasesTable releases={releases} />
        </Tabs.Panel>
        <Tabs.Panel style={{ padding: '0' }} value='variant-releases'>
          TBA
        </Tabs.Panel>
      </Tabs>
    )
  }

  return (
    <>
      <Test></Test>
      <div>
        <Heading level={1} data-size='md'>
          Meld publiseringsdato
        </Heading>
      </div>
      {renderReleasesTables()}
    </>
  )
}
