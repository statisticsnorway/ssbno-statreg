import './CreateRelease.css'

import { useState, useEffect } from 'react'
import { useParams, Link as ReactRouterLink } from 'react-router'
import { Heading, Tabs, Dialog, Paragraph, Button } from '@digdir/designsystemet-react'
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

type CreateReleaseTablesProps = {
  releases: ReleaseListing[]
  variantReleases: ReleaseListing[]
  shortname: string
  variant: string
}

type CreateReleaseModalProps = {
  openCreateReleaseModal: boolean
  createdRelease: ReleaseDetails
  setOpenCreateReleaseModal: React.Dispatch<React.SetStateAction<boolean>>
}

function CreateReleaseModal({
  openCreateReleaseModal,
  createdRelease,
  setOpenCreateReleaseModal,
}: CreateReleaseModalProps) {
  const { id, publish_time, variant, statistic } = createdRelease ?? {}

  const frequency = variant?.frequency?.name
  const revisionName = variant?.revision?.name ? RevisionNames[variant.revision.name as keyof typeof RevisionNames] : ''
  const variantInformation = [frequency, revisionName].join(', ').toLowerCase()

  return (
    <Dialog id='create-release-modal' open={openCreateReleaseModal} onClose={() => setOpenCreateReleaseModal(false)}>
      <Dialog.Block>
        <Heading data-size='xs'>Publiseringsdato er registrert</Heading>
      </Dialog.Block>
      <Dialog.Block>
        <Paragraph>
          Datoen {formatPublishTime(publish_time)} er nå sendt inn for {variantInformation}
        </Paragraph>
      </Dialog.Block>
      <Dialog.Block>
        <div className='create-realease-modal-button-wrapper '>
          <Button variant='primary' asChild>
            <ReactRouterLink to={`/statistikk/${statistic?.shortname}`}>Ok</ReactRouterLink>
          </Button>
          <Button variant='tertiary' asChild>
            <ReactRouterLink to={`/publisering/${id}`}>Se detaljer</ReactRouterLink>
          </Button>
        </div>
      </Dialog.Block>
    </Dialog>
  )
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
      <CreateReleaseModal
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
