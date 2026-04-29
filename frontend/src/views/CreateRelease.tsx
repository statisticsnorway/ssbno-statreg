import { useState, useEffect } from 'react'
import { Heading, Tabs } from '@digdir/designsystemet-react'
import { CalendarIcon } from '@navikt/aksel-icons'
import { type ReleaseListing } from '@ssbno-statreg/shared'

import client from '../api'
import { ReleasesTable } from '../components/ReleasesTable'

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

  function renderReleasesTables() {
    const release = Object.entries(releases).map(([__, release]) => release)[0]
    return (
      <Tabs defaultValue='selected-publish-date' style={{ width: '100%', rowGap: 'var(--ds-size-10)' }}>
        <Tabs.List style={{ marginBottom: 'var(--ds-size-10)' }}>
          <Tabs.Tab value='selected-publish-date'>
            <CalendarIcon />
            Publiseringer på valgt dato
          </Tabs.Tab>
          <Tabs.Tab value='all-releases'>
            Alle publiseringer på {release?.statistic?.shortname}, {release?.frequency?.name}
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel style={{ padding: '0' }} value='selected-publish-date'> {/* TODO: Padding can be set with classes instead of inline-css */}
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
      <Heading level={1} data-size='sm'>
        Meld publiseringsdato
      </Heading>

      {renderReleasesTables()}
    </>
  )
}
