import { Field, Label, Select } from '@digdir/designsystemet-react'

const ROW_COUNT_OPTIONS = [10, 20, 50, 100]

export type ShowRowCountSelectProps = {
  selectedRowCount?: number
  updateRowCount: (rows: number) => void
}

export function RowCountSelect({ selectedRowCount, updateRowCount }: ShowRowCountSelectProps) {
  return (
    <Field>
      <Label>Vis antall rader</Label>
      <Select defaultValue={selectedRowCount} onChange={(e) => updateRowCount(Number(e.target.value))}>
        {ROW_COUNT_OPTIONS.map((count) => (
          <Select.Option key={count} value={String(count)}>
            {count}
          </Select.Option>
        ))}
      </Select>
    </Field>
  )
}
