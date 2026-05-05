import { useState, useEffect } from 'react'
import { ReleasesTable } from '../components/ReleasesTable'
import { Heading, Field, Label, Select, Pagination, usePagination, Button } from '@digdir/designsystemet-react'
import { ArrowLeftIcon, ArrowRightIcon } from '@navikt/aksel-icons'
import type { ReleaseListing } from '@ssbno-statreg/shared'
import { DatePicker } from '../components/DatePicker'

import './ListReleases.css'
import client from '../api'
import { getFirstDayOfNthMonth, getLastDayOfNthMonth } from '../lib/utils'

const ROW_COUNT_OPTIONS = [10, 20, 50, 100]

type ShowRowCountSelectProps = {
  showRowCount: number
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

function ShowRowCountSelect({ showRowCount, onChange }: ShowRowCountSelectProps) {
  return (
    <Field>
      <Label>Vis antall rader</Label>
      <Select defaultValue={showRowCount} onChange={onChange}>
        {ROW_COUNT_OPTIONS.map((count) => (
          <Select.Option key={count} value={String(count)}>
            {count}
          </Select.Option>
        ))}
      </Select>
    </Field>
  )
}

type ListReleasesTablePaginationProps = {
  pages: ReturnType<typeof usePagination>['pages']
  prevButtonProps: ReturnType<typeof usePagination>['prevButtonProps']
  nextButtonProps: ReturnType<typeof usePagination>['nextButtonProps']
  hasPrev: boolean
  hasNext: boolean
}

function ListReleasesTablePagination({
  pages,
  prevButtonProps,
  nextButtonProps,
  hasPrev,
  hasNext,
}: ListReleasesTablePaginationProps) {
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

function ListReleases() {
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const [calendarMonth, setCalendarMonth] = useState(0)

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  return (
    <>
      <Heading level={1} data-size='sm'>
        Publiseringsoversikt
      </Heading>

      <div className='list-releases-calendars-container'>
        <Heading level={2} data-size='xs'>
          Publiseringskalender
        </Heading>
        <div className='list-releases-calendars-buttons'>
          <Button variant='tertiary' onClick={() => setCalendarMonth((prev) => prev - 3)}>
            <ArrowLeftIcon /> Forrige
          </Button>
          <Button variant='tertiary' onClick={() => setCalendarMonth((prev) => prev + 3)}>
            Neste <ArrowRightIcon />
          </Button>
        </div>
        <div className='list-releases-calendars-wrapper'>
          <DatePicker fromDate={getFirstDayOfNthMonth(calendarMonth)} toDate={getLastDayOfNthMonth(calendarMonth)} />
          <DatePicker
            fromDate={getFirstDayOfNthMonth(calendarMonth + 1)}
            toDate={getLastDayOfNthMonth(calendarMonth + 1)}
          />
          <DatePicker
            fromDate={getFirstDayOfNthMonth(calendarMonth + 2)}
            toDate={getLastDayOfNthMonth(calendarMonth + 2)}
            showColorCodingExplanation
          />
        </div>
      </div>

      <ReleasesTable
        releases={releases}
        rowSelection={<ShowRowCountSelect showRowCount={showRowCount} onChange={handleChangeShowRowCount} />}
        pagination={
          <ListReleasesTablePagination
            pages={pages}
            prevButtonProps={prevButtonProps}
            nextButtonProps={nextButtonProps}
            hasPrev={hasPrev}
            hasNext={hasNext}
          />
        }
      />
    </>
  )
}

export default ListReleases
