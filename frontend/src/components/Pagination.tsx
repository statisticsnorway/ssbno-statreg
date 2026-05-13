import { useState, useEffect } from 'react'
import { type ReleaseListing } from '@ssbno-statreg/shared'
import { Field, Label, Select, Pagination as DsPagination, usePagination } from '@digdir/designsystemet-react'

export type PaginatedTableData = {
  tableData: ReleaseListing[]
  total: number
}

export type FetchTableData = (args: { start: number; count: number }) => Promise<PaginatedTableData>

export function useTablePagination({ fetchTableData }: { fetchTableData: FetchTableData }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [showRowCount, setShowRowCount] = useState(10)

  const start = (currentPage - 1) * showRowCount
  const [tableData, setTableData] = useState<ReleaseListing[]>([])
  const [total, setTotal] = useState(0)

  const { pages, prevButtonProps, nextButtonProps, hasNext, hasPrev } = usePagination({
    currentPage,
    setCurrentPage,
    totalPages: Math.ceil(total / showRowCount),
    showPages: 6,
  })

  useEffect(() => {
    fetchTableData({ start, count: showRowCount })
      .then(({ tableData, total }) => {
        setTableData(tableData)
        setTotal(total)
      })
      .catch((err) => {
        console.error(err)
        alert('Failed to fetch table data') // TODO: Generic error handling
      })
  }, [start, showRowCount, fetchTableData])

  function handleChangeShowRowCount(e: React.ChangeEvent<HTMLSelectElement>) {
    setShowRowCount(Number(e.target.value))
    setCurrentPage(1)
  }

  return {
    tableData,
    handleChangeShowRowCount,
    showRowCount,
    pages,
    prevButtonProps,
    nextButtonProps,
    hasNext,
    hasPrev,
  }
}

const ROW_COUNT_OPTIONS = [10, 20, 50, 100]

type ShowRowCountSelectProps = {
  showRowCount: number
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

export function ShowRowCountSelect({ showRowCount, onChange }: ShowRowCountSelectProps) {
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

type PaginationProps = {
  pages: ReturnType<typeof usePagination>['pages']
  prevButtonProps: ReturnType<typeof usePagination>['prevButtonProps']
  nextButtonProps: ReturnType<typeof usePagination>['nextButtonProps']
  hasPrev: boolean
  hasNext: boolean
}

export function Pagination({ pages, prevButtonProps, nextButtonProps, hasPrev, hasNext }: PaginationProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--ds-size-18)' }}>
      <DsPagination aria-label='pagineringsmeny'>
        <DsPagination.List>
          <DsPagination.Item>
            <DsPagination.Button {...prevButtonProps} disabled={!hasPrev}>
              Forrige
            </DsPagination.Button>
          </DsPagination.Item>
          {pages.map(({ page, itemKey, buttonProps }) => (
            <DsPagination.Item key={itemKey}>
              {typeof page === 'number' && (
                <DsPagination.Button aria-label={`Side ${page}`} {...buttonProps}>
                  {page}
                </DsPagination.Button>
              )}
            </DsPagination.Item>
          ))}
          <DsPagination.Item>
            <DsPagination.Button {...nextButtonProps} disabled={!hasNext}>
              Neste
            </DsPagination.Button>
          </DsPagination.Item>
        </DsPagination.List>
      </DsPagination>
    </div>
  )
}
