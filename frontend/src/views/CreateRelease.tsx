import './CreateRelease.css'

import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { Heading, Tabs } from '@digdir/designsystemet-react'
import { CalendarIcon } from '@navikt/aksel-icons'
import {
  type ReleaseCreate,
  type ReleaseDetails,
  type ReleaseListing,
  ApprovalStatus,
  RevisionNames,
} from '@ssbno-statreg/shared'

import { formatDate, formatPublishTime } from '../lib/utils'
import { ReleasesTable } from '../components/ReleasesTable'
import { ReleaseForm } from '../components/ReleaseForm'
import { DayStatusTag } from '../components/DayStatus'
import { ApprovalStatusTag } from '../components/ApprovalStatus'

import client from '../api'
import ReleaseFormModal from '../components/ReleaseFormModal'

type CreateReleaseTablesProps = {
  releases: ReleaseListing[]
  variantReleases: ReleaseListing[]
  shortname: string
  variant: string
}

function CreateReleaseTables({ releases, variantReleases, shortname, variant }: CreateReleaseTablesProps) {
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
        <ReleasesTable releases={variantReleases} />
      </Tabs.Panel>
    </Tabs>
  )
}

function CreateRelease() {
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [variantReleases, setVariantReleases] = useState<ReleaseListing[]>([])
  const [openCreateReleaseModal, setOpenCreateReleaseModal] = useState(false)
  const [createdRelease, setCreatedRelease] = useState<ReleaseDetails>({})

  const { shortname, variantId } = useParams()
  const variantIdAsNumber = Number(variantId)

  useEffect(() => {
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
  }, [])

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
  }, [shortname, variantIdAsNumber])

  async function createRelease(body: ReleaseCreate) {
    const { data, error } = await client.POST('/statistics/{shortname}/variants/{id}/releases', {
      params: { path: { shortname: shortname as string, id: Number(variantId) } },
      body,
    })

    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (error as any).error
      console.log(errorMessage)
      alert(errorMessage)
    } else {
      setOpenCreateReleaseModal(true)
      setCreatedRelease(data)
    }
  }

  const statisticName = variantReleases[0]?.statistic?.name ?? ''
  const statisticShortname = variantReleases[0]?.statistic?.shortname ?? ''
  const variant = variantReleases[0]?.frequency?.name?.toLowerCase() ?? ''
  const approvalStatus = variantReleases[0]?.approval_status ?? ApprovalStatus.PENDING

  const createdReleaseVariant = createdRelease?.variant
  const createdReleaseFrequency = createdReleaseVariant?.frequency?.name
  const createdReleaseRevisionName = createdReleaseVariant?.revision?.name
    ? RevisionNames[createdReleaseVariant?.revision.name as keyof typeof RevisionNames]
    : ''
  const variantInformation = [createdReleaseFrequency, createdReleaseRevisionName].join(', ').toLowerCase()

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
      <ReleaseForm onFormSubmit={createRelease} />
      <ReleaseFormModal
        modalHeading='Publiseringsdato er registrert'
        modalDescription={`Datoen ${formatPublishTime(createdRelease?.publish_time)} er nå sendt inn for ${variantInformation}`}
        openCreateReleaseModal={openCreateReleaseModal}
        createdRelease={createdRelease}
        setOpenCreateReleaseModal={setOpenCreateReleaseModal}
      />
      <CreateReleaseTables
        releases={releases}
        variantReleases={variantReleases}
        shortname={statisticShortname}
        variant={variant}
      />
    </>
  )
}

export default CreateRelease
