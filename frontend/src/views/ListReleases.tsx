import { useState, useEffect } from 'react'
import { ReleasesTable } from '../components/ReleasesTable'
import { Heading, Field, Label, Select, Pagination, usePagination } from '@digdir/designsystemet-react'
import type { ReleaseListing } from '@ssbno-statreg/shared'
import { DatePicker } from '../components/DatePicker'

import './ListReleases.css'
import client from '../api'

function ListReleases() {
  const [releases, setReleases] = useState<ReleaseListing[]>([])

  const [showRowCount, setShowRowCount] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)

  const { pages, prevButtonProps, nextButtonProps, hasNext, hasPrev } = usePagination({
    currentPage,
    setCurrentPage,
    totalPages: Math.ceil(total / showRowCount),
    showPages: 6,
  })

  useEffect(() => {
    async function fetchReleases() {
      const start = (currentPage - 1) * showRowCount
      const { data, error } = await client.GET('/releases', { params: { query: { start, count: showRowCount } } })
      if (error) {
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setReleases(data?.releases ?? [])
        setTotal(data.total ?? 0)
      }
    }
    fetchReleases()
  }, [currentPage, showRowCount])

  function handleChangeShowRowCount(e: React.ChangeEvent<HTMLSelectElement>) {
    setShowRowCount(Number(e.target.value))
    setCurrentPage(1)
  }

  const ShowRowCountSelect = () => {
    return (
      <Field>
        <Label>Vis antall rader</Label>
        <Select defaultValue={showRowCount} onChange={handleChangeShowRowCount}>
          <Select.Option value='10'>10</Select.Option>
          <Select.Option value='20'>20</Select.Option>
          <Select.Option value='50'>50</Select.Option>
          <Select.Option value='100'>100</Select.Option>
        </Select>
      </Field>
    )
  }

  const ListReleasesTablePagination = () => {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--ds-size-18)' }}>
        <Pagination aria-label='pagineringsmeny'>
          <Pagination.List>
            <Pagination.Item>
              <Pagination.Button {...prevButtonProps} disabled={!hasPrev}>
                Forrige
              </Pagination.Button>
            </Pagination.Item>
            {pages.map(({ page, itemKey, buttonProps }) => (
              <Pagination.Item key={itemKey}>
                {typeof page === 'number' && (
                  <Pagination.Button aria-label={`Side ${page}`} {...buttonProps}>
                    {page}
                  </Pagination.Button>
                )}
              </Pagination.Item>
            ))}
            <Pagination.Item>
              <Pagination.Button {...nextButtonProps} disabled={!hasNext}>
                Neste
              </Pagination.Button>
            </Pagination.Item>
          </Pagination.List>
        </Pagination>
      </div>
    )
  }

  // first day of the calculated month
  function calculateFromDate(now: Date, monthsAhead: number): Date {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthsAhead, 1)) 
  }

  // last day of the calculated month
  function calculateToDate(now: Date, monthsAhead: number): Date {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthsAhead + 1, 0)) 
  }

  const now = new Date()

  return (
    <>
      <Heading level={1} data-size='sm'>
        Publiseringsoversikt
      </Heading>

      <div className='list-releases-calendars-container'>
        <Heading level={2} data-size='xs'>
          Publiseringskalender
        </Heading>
        <div className='list-releases-calendars-wrapper'>
          <DatePicker fromDate={calculateFromDate(now, 0)} toDate={calculateToDate(now, 0)} />
          <DatePicker fromDate={calculateFromDate(now, 1)} toDate={calculateToDate(now, 1)} />
          <DatePicker
            fromDate={calculateFromDate(now, 2)}
            toDate={calculateToDate(now, 2)}
            showColorCodingExplanation
          />
        </div>
      </div>

      <ReleasesTable
        releases={releases}
        rowSelection={<ShowRowCountSelect />}
        pagination={<ListReleasesTablePagination />}
      />
    </>
  )
}

export default ListReleases
