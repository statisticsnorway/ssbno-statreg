import { Field, Label, Select, Pagination as DsPagination, usePagination } from '@digdir/designsystemet-react'

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
