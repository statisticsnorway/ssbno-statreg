import './CreateRelease.css'

import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { Heading, Tabs } from '@digdir/designsystemet-react'
import { CalendarIcon } from '@navikt/aksel-icons'
import {
  type ReleaseCreate,
  type ReleaseDetails,
  type ReleaseListing,
  type StatisticDetails,
  ApprovalStatus,
  RevisionNames,
} from '@ssbno-statreg/shared'

import { formatDate, formatPublishTime } from '../lib/utils'
import { PaginatedReleasesTable, ReleasesTable } from '../components/ReleasesTable'
import { ReleaseForm } from '../components/ReleaseForm'
import { DayStatusTag } from '../components/DayStatus'
import { ApprovalStatusTag } from '../components/ApprovalStatus'

import client from '../api'
import ReleaseFormModal from '../components/ReleaseFormModal'
import { RowCountSelect } from '../components/RowCountSelect'

function OtherReleasesOnThisVariantPanel() {
  const { shortname, variantId } = useParams()
  const [count, setCount] = useState(10)
  const [start, setStart] = useState(0)
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState<string[]>([])

  useEffect(() => {
    async function fetchVariantReleases() {
      const variantIdAsNumber = Number(variantId)
      const { data, error } = await client.GET('/statistics/{shortname}/variants/{id}/releases', {
        params: {
          path: { shortname: shortname as string, id: variantIdAsNumber },
          query: { start, count, sort: sortBy.join(',') },
        },
      })
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setReleases(data?.releases ?? [])
        setTotal(data.total ?? 0)
      }
    }
    fetchVariantReleases()
  }, [shortname, variantId, count, start, sortBy])

  function updateRowCount(newCount: number) {
    setCount(newCount)
    setStart(0)
  }

  function setCurrentPage(currentPage: number) {
    setStart((currentPage - 1) * count)
  }

  return (
    <Tabs.Panel className='p-0' value='variant-releases'>
      <div
        style={{
          display: 'flex',
          justifyContent: 'end',
          marginBottom: 'var(--ds-size-8)',
          width: '100%',
        }}
      >
        <RowCountSelect selectedRowCount={count} updateRowCount={updateRowCount} />
      </div>
      <PaginatedReleasesTable
        start={start}
        count={count}
        total={total}
        releases={releases}
        setCurrentPage={setCurrentPage}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
    </Tabs.Panel>
  )
}

function OtherReleasesOnThisDatePanel() {
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [sortBy, setSortBy] = useState<string[]>([])

  useEffect(() => {
    async function fetchReleases() {
      // TODO: Add filter on selected date
      const { data, error } = await client.GET('/releases', {
        params: { query: { start: 0, count: 10, sort: sortBy.join(',') } },
      })
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
    // Add selected date as a dependency
  }, [sortBy])

  return (
    <Tabs.Panel className='p-0' value='selected-publish-date'>
      <div className='description-wrapper'>
        {/* TODO: Placeholder date and day status for description */}
        <span>Innmeldte datoer den {formatDate(releases[0]?.publish_time)}</span>
        {/* TODO: Get status from the calendar response */}
        <DayStatusTag status={'MANY'} />
      </div>
      <ReleasesTable releases={releases} sortBy={sortBy} setSortBy={setSortBy} />
    </Tabs.Panel>
  )
}

function CreateRelease() {
  const [openCreateReleaseModal, setOpenCreateReleaseModal] = useState(false)
  const [createdRelease, setCreatedRelease] = useState<ReleaseDetails>({})
  const [statistic, setStatistic] = useState<StatisticDetails>({})

  const { shortname, variantId } = useParams()

  useEffect(() => {
    async function fetchStatistic(shortname?: string) {
      const { data, error } = await client.GET('/statistics/{shortname}', {
        params: { path: { shortname: shortname as string } },
      })

      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setStatistic(data)
      }
    }
    fetchStatistic(shortname)
  }, [shortname])

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

  const statisticName = statistic?.name ?? ''
  const statisticShortname = shortname
  const frequency = statistic.variants?.find((variant) => variant.id === Number(variantId))?.frequency?.name ?? ''
  const approvalStatus = ApprovalStatus.PENDING

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
          {statisticName} ({statisticShortname}) og {frequency.toLowerCase()}
        </Heading>
        <ApprovalStatusTag status={approvalStatus} />
      </div>
      <ReleaseForm onFormSubmit={createRelease} shortname={shortname as string} />
      <ReleaseFormModal
        modalHeading='Publiseringsdato er registrert'
        modalDescription={`Datoen ${formatPublishTime(createdRelease?.publish_time)} er nå sendt inn for ${variantInformation}.`}
        openCreateReleaseModal={openCreateReleaseModal}
        createdRelease={createdRelease}
        setOpenCreateReleaseModal={setOpenCreateReleaseModal}
      />
      <Tabs defaultValue='selected-publish-date' className='create-release-tables-tab'>
        <Tabs.List>
          <Tabs.Tab value='selected-publish-date'>
            <CalendarIcon />
            Publiseringer på valgt dato
          </Tabs.Tab>
          <Tabs.Tab value='variant-releases'>
            Alle publiseringer på {shortname}, {frequency.toLowerCase()}
          </Tabs.Tab>
        </Tabs.List>
        <OtherReleasesOnThisDatePanel />
        <OtherReleasesOnThisVariantPanel />
      </Tabs>
    </>
  )
}

export default CreateRelease
