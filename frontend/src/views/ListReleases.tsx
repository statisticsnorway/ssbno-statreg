import { useState, useEffect } from 'react'
import { ReleasesTable } from '../components/ReleasesTable'
import {
  Heading,
  Field,
  Label,
  Select,
  Pagination,
  usePagination,
} from '@digdir/designsystemet-react'
import type { CalendarDates, ReleaseListing } from '@ssbno-statreg/shared'
import { DatePicker } from '../components/DatePicker'

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

  // TODO: MIM-2657: Implement calender logic
  const exampleCalendarDates: CalendarDates = {
    '2026-04-03': { status: 'free' },
    '2026-04-05': { status: 'few' },
    '2026-04-10': { status: 'many' },
    '2026-04-15': { status: 'full' },
    '2026-04-20': { status: 'blocked' },
    '2026-04-25': { status: 'few' },
  }

  
return (
    <>
      <Heading level={1} data-size='sm'>
        Publiseringsoversikt
      </Heading>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-size-4)' }}>
        <Heading level={2} data-size='xs'>Publiseringskalender</Heading>
        <DatePicker
          calendarDates={exampleCalendarDates}
          fromDate={new Date(2026, 3, 1)}
          toDate={new Date(2026, 3, 30)}
          showColorCodingExplanation
        />
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
