import { useMemo } from 'react'
import { EXPERIMENTAL_Suggestion as Suggestion, type SuggestionItem } from '@statisticsnorway/design-react'
import type { Division } from '@ssbno-statreg/shared'

export type DivisionSelectionProps = {
  id?: string
  ariaInvalid?: boolean
  divisions: Division[]
  selected: string
  setSelected: (selected: string) => void
}

function formatDivision(division: Division) {
  return `${division.name} (${division.code})`
}

export function DivisionSelection({
  id,
  ariaInvalid,
  divisions,
  selected,
  setSelected,
}: Readonly<DivisionSelectionProps>) {
  const divisionMap = useMemo(
    () =>
      divisions.reduce<Record<string, Division>>((record, division) => {
        if (!division.code) return record

        record[division.code] = division
        return record
      }, {}),
    [divisions]
  )

  const selectedItem = useMemo<SuggestionItem | null>(() => {
    if (!selected) return null

    const division = divisionMap[selected]

    return {
      label: division ? formatDivision(division) : selected,
      value: selected,
    }
  }, [divisionMap, selected])

  const options = useMemo(
    () =>
      divisions.flatMap((division) => {
        if (!division.code) return []

        return (
          <Suggestion.Option key={`division-${division.code}`} label={formatDivision(division)} value={division.code}>
            {formatDivision(division)}
          </Suggestion.Option>
        )
      }),
    [divisions]
  )

  return (
    <Suggestion
      key={selected || 'empty'}
      onSelectedChange={(item) => setSelected(item?.value ?? '')}
      selected={selectedItem}
    >
      <Suggestion.Input id={id} aria-invalid={ariaInvalid} />
      <Suggestion.Clear aria-label='Tøm valgt seksjon' onClick={() => setSelected('')} />
      <Suggestion.List>
        <Suggestion.Empty>Ingen treff</Suggestion.Empty>
        {options}
      </Suggestion.List>
    </Suggestion>
  )
}
