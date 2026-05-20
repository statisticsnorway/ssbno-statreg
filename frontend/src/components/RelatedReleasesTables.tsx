import './RelatedReleasesTables.css'

import { useState, useEffect } from 'react'
import { Tabs } from '@digdir/designsystemet-react'
import { CalendarIcon } from '@navikt/aksel-icons'
import { type ReleaseListing } from '@ssbno-statreg/shared'

import { formatDate } from '../lib/utils'
import { PaginatedReleasesTable, ReleasesTable } from './ReleasesTable'
import { DayStatusTag } from './DayStatus'

import client from '../api'

type VariantReleasesTableProps = {
  shortname: string
  variantId: number
}

function VariantReleasesTable({ shortname, variantId }: VariantReleasesTableProps) {
  const [count, setCount] = useState(10)
  const [start, setStart] = useState(0)
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    async function fetchVariantReleases() {
      const { data, error } = await client.GET('/statistics/{shortname}/variants/{id}/releases', {
        params: { path: { shortname, id: variantId }, query: { start, count } },
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
  }, [shortname, variantId, count, start])

  function updateRowCount(newCount: number) {
    setCount(newCount)
    setStart(0)
  }

  function setCurrentPage(currentPage: number) {
    setStart((currentPage - 1) * count)
  }

  return (
    <Tabs.Panel className='p-0' value='variant-releases'>
      <PaginatedReleasesTable
        start={start}
        count={count}
        total={total}
        releases={releases}
        updateRowCount={updateRowCount}
        setCurrentPage={setCurrentPage}
      />
    </Tabs.Panel>
  )
}

// TODO add date as prop
function DateReleasesTable() {
  const [releases, setReleases] = useState<ReleaseListing[]>([])

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

  return (
    <Tabs.Panel className='p-0' value='selected-publish-date'>
      <div className='description-wrapper'>
        <span>Innmeldte datoer den {formatDate(releases[0]?.publish_time)}</span>
        <DayStatusTag status={'MANY'} />
      </div>
      <ReleasesTable releases={releases} />
    </Tabs.Panel>
  )
}

export function RelatedReleasesTables({ shortname, variantId }: VariantReleasesTableProps) {
  return (
    <Tabs defaultValue='selected-publish-date' className='related-releases-tables-tab'>
      <Tabs.List>
        <Tabs.Tab value='selected-publish-date'>
          <CalendarIcon />
          Publiseringer på valgt dato
        </Tabs.Tab>
        <Tabs.Tab value='variant-releases'>Alle publiseringer på {shortname}</Tabs.Tab>
      </Tabs.List>
      <DateReleasesTable />
      <VariantReleasesTable shortname={shortname} variantId={variantId} />
    </Tabs>
  )
}
