import { Field, Label, Select } from '@digdir/designsystemet-react'

const ROW_COUNT_OPTIONS = [10, 20, 50, 100]

type ShowRowCountSelectProps = {
  showRowCount: number
  updatedRowCount: (rows: number) => void
}

export function RowCountSelect({ showRowCount, updatedRowCount }: ShowRowCountSelectProps) {
  return (
    <Field>
      <Label>Vis antall rader</Label>
      <Select defaultValue={showRowCount} onChange={(e) => updatedRowCount(Number(e.target.value))}>
        {ROW_COUNT_OPTIONS.map((count) => (
          <Select.Option key={count} value={String(count)}>
            {count}
          </Select.Option>
        ))}
      </Select>
    </Field>
  )
}
