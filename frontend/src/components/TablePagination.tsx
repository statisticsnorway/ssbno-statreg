import { Field, Label, Select, Pagination, usePagination } from '@digdir/designsystemet-react'

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

export function TablePagination({ pages, prevButtonProps, nextButtonProps, hasPrev, hasNext }: PaginationProps) {
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
