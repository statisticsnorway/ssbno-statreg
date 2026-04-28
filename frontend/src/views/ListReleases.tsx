import { useState, useEffect } from 'react'
import {
  Heading,
  Table,
  Field,
  Label,
  Select,
  Pagination,
  usePagination,
} from '@digdir/designsystemet-react'
import { type ReleaseListing } from '@ssbno-statreg/shared'
import { formatPublishTime, formatDate } from '../lib/utils'
import { ApprovalStatusBadge } from '../components/ApprovalStatus'
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

  const tableHeaderCells = [
    'Kortnavn',
    'Statistikknavn',
    'Variant',
    'Måleperiodetittel',
    'Målperiode fra',
    'Måleperiode til',
    'Publiseringsdato',
    'Status',
  ]

  function renderListReleasesTableHeaderCells() {
    return tableHeaderCells.map((header) => <Table.HeaderCell key={header}>{header}</Table.HeaderCell>)
  }

  const TruncatedTableCell = ({ value, maxWidth = '340px' }: { value: string | undefined; maxWidth?: string }) => (
    <Table.Cell style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth }} title={value}>
      {value}
    </Table.Cell>
  )

  // TODO: MIM-2555: Add måleperiodetittel after logic is implemented
  function renderListReleasesTableRows() {
    return Object.entries(releases).map(([__, release]) => (
      <Table.Row key={`${release.publish_time}-${release.id}`}>
        <Table.Cell>{release.statistic?.shortname ?? ''}</Table.Cell>
        <TruncatedTableCell value={release.statistic?.name} />
        <Table.Cell>{release.frequency?.name ?? ''}</Table.Cell>
        <Table.Cell>TBA</Table.Cell>
        <Table.Cell>{formatDate(release.period_from)}</Table.Cell>
        <Table.Cell>{formatDate(release.period_to)}</Table.Cell>
        <Table.Cell>{formatPublishTime(release.publish_time)}</Table.Cell>
        <Table.Cell>
          <ApprovalStatusBadge status={release.approval_status} />
        </Table.Cell>
      </Table.Row>
    ))
  }

  function renderShowRowCountSelect() {
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

  function renderListReleasesTablePagination() {
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

  function renderListReleasesTable() {
    return (
      <>
        <div style={{ minWidth: '100%' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'end', 
              marginBottom: 'var(--ds-size-8)',
            }}
          >
            {renderShowRowCountSelect()}
          </div>
          <Table>
            <Table.Head>
              <Table.Row>{renderListReleasesTableHeaderCells()}</Table.Row>
            </Table.Head>
            <Table.Body>{renderListReleasesTableRows()}</Table.Body>
          </Table>
          {renderListReleasesTablePagination()}
        </div>
      </>
    )
  }

  return (
    <>
      <Heading level={1} data-size='sm'>Publiseringsoversikt</Heading>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-size-1)' }}>
        <Heading level={2}>Publiseringskalender</Heading>
        <DatePicker calendarDates={{}} />
      </div>

      {renderListReleasesTable()}
    </>
  )
}

export default ListReleases
