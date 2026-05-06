import './CreateRelease.css'

import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { Heading, Tabs } from '@digdir/designsystemet-react'
import { CalendarIcon } from '@navikt/aksel-icons'
import { type ReleaseListing, ApprovalStatus } from '@ssbno-statreg/shared'

import { formatDate } from '../lib/utils'
import { ReleasesTable } from '../components/ReleasesTable'
import { ReleaseForm } from '../components/ReleaseForm'
import { DayStatusTag } from '../components/DayStatus'
import { ApprovalStatusTag } from '../components/ApprovalStatus'

import client from '../api'

type CreateReleaseTablesProps = {
  releases: ReleaseListing[]
  shortname: string
  variant: string
}

function CreateReleaseTables({ releases, shortname, variant }: CreateReleaseTablesProps) {
  return (
    <Tabs defaultValue='selected-publish-date' className='create-release-tables-tab'>
      <Tabs.List>
        <Tabs.Tab value='selected-publish-date'>
          <CalendarIcon />
          Publiseringer på valgt dato
        </Tabs.Tab>
        <Tabs.Tab value='variant-releases'>
          Alle publiseringer på {shortname}, {variant}
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel className='p-0' value='selected-publish-date'>
        <div className='description-wrapper'>
          {/* TODO: Placeholder date and day status for description */}
          <span>Innmeldte datoer den {formatDate(releases[0]?.publish_time)}</span>
          <DayStatusTag status={'MANY'} />
        </div>
        <ReleasesTable releases={releases} />
      </Tabs.Panel>
      <Tabs.Panel className='p-0' value='variant-releases'>
        TBA
      </Tabs.Panel>
    </Tabs>
  )
}

function CreateRelease() {
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [variantReleases, setVariantReleases] = useState<ReleaseListing[]>([])
  const { shortname, variantId } = useParams()
  const variantIdAsNumber = Number(variantId)

  useEffect(() => {
    async function fetchVariantRelease() {
      const { data, error } = await client.GET('/statistics/{shortname}/variants/{id}/releases', {
        params: { path: { shortname: shortname as string, id: variantIdAsNumber } },
      })
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setVariantReleases(data?.releases ?? [])
      }
    }
    fetchVariantRelease()

    async function fetchReleases() {
      const { data, error } = await client.GET('/releases', { params: { query: { start: 0, count: 10 } } })
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setReleases(data?.releases ?? [])
      }
    }
    fetchReleases()
  }, [shortname, variantId])

  const statisticName = variantReleases[0]?.statistic?.name ?? ''
  const statisticShortname = variantReleases[0]?.statistic?.shortname ?? ''
  const variant = variantReleases[0]?.frequency?.name ?? ''
  const approvalStatus = variantReleases[0]?.approval_status ?? ApprovalStatus.PENDING

  return (
    <>
      <div className='release-description-wrapper'>
        <Heading level={1} data-size='md'>
          Meld publiseringsdato
        </Heading>
        <Heading data-size='xs' level={2}>
          {statisticName} ({statisticShortname}) og {variant}
        </Heading>
        <ApprovalStatusTag status={approvalStatus} />
      </div>
      <ReleaseForm shortname={shortname as string} variantId={variantIdAsNumber} />
      <CreateReleaseTables releases={releases} shortname={statisticShortname} variant={variant} />
    </>
  )
}

export default CreateRelease
