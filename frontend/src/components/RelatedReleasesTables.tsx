import './RelatedReleasesTables.css'

import { Tabs } from '@digdir/designsystemet-react'
import { CalendarIcon } from '@navikt/aksel-icons'

import { formatDate } from '../lib/utils'
import { DayStatusTag } from './DayStatus'
import { useState, useEffect } from 'react'
import { type ReleaseListing } from '@ssbno-statreg/shared'
import { PaginatedReleasesTable } from './ReleasesTable'
import { ReleasesTable } from './ReleasesTable'
import { RowCountSelect } from './RowCountSelect'

import client from '../api'

type RelatedReleasesTablesProps = {
  shortname: string
  date: string
  variantId: number
}

export function RelatedReleasesTables({ shortname, date, variantId }: RelatedReleasesTablesProps) {
  return (
    <Tabs defaultValue='selected-publish-date' className='related-releases-tables-tab'>
      <Tabs.List>
        <Tabs.Tab value='selected-publish-date'>
          <CalendarIcon />
          Publiseringer på valgt dato
        </Tabs.Tab>
        <Tabs.Tab value='variant-releases'>Alle publiseringer på {shortname}</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel className='p-0' value='selected-publish-date'>
        <div className='description-wrapper'>
          {/* TODO: Placeholder date and day status for description */}
          <span>Innmeldte datoer den {formatDate(date)}</span>
          {/* TODO: Get status from the calendar response */}
          <DayStatusTag status={'MANY'} />
        </div>
        <DateReleasesTable />
      </Tabs.Panel>
      <Tabs.Panel className='p-0' value='variant-releases'>
        <VariantReleasesTable shortname={shortname} variantId={variantId} />
      </Tabs.Panel>
    </Tabs>
  )
}

// TODO should take a date prop
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

  return <ReleasesTable releases={releases} />
}

function VariantReleasesTable({ shortname, variantId }: { shortname: string; variantId: number }) {
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
    <>
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
      />
    </>
  )
}
