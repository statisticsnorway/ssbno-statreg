import { Pagination as DsPagination, usePagination } from '@statisticsnorway/design-react'

export type PaginationProps = {
  start: number
  count: number
  total: number
  setCurrentPage: (selectedPage: number) => void
}

export function Pagination({ start, count, total, setCurrentPage }: PaginationProps) {
  const { pages, prevButtonProps, nextButtonProps, hasNext, hasPrev } = usePagination({
    currentPage: Math.floor(start / count) + 1,
    setCurrentPage,
    totalPages: Math.ceil(total / count),
    showPages: 6,
  })
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
