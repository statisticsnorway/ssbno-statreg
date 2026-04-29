import '@navikt/ds-css/dist/global/tokens.css'
import '@navikt/ds-css/dist/components.css'

import { DatePicker as AkselDatePicker } from '@navikt/ds-react/DatePicker'
import { type CalenderDate, DayStatus } from '@ssbno-statreg/shared'
import { Paragraph } from '@digdir/designsystemet-react'

type DatePickerProps = React.ComponentProps<typeof AkselDatePicker.Standalone> & {
  calendarDates: CalenderDate
  showColorCodingExplanation?: boolean
}

function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function DatePicker({ calendarDates, showColorCodingExplanation, ...props }: DatePickerProps) {
  const full: Date[] = []
  const many: Date[] = []
  const few: Date[] = []
  const blocked: Date[] = []

  for (const [dateString, value] of Object.entries(calendarDates) as [string, CalenderDate[string]][]) {
    const date = parseDate(dateString)
    if (value.status === 'full') full.push(date)
    else if (value.status === 'more') many.push(date)
    else if (value.status === 'few') few.push(date)
    else if (value.status === 'blocked') blocked.push(date)
  }

  const statusColors: Record<keyof typeof DayStatus, { backgroundColor: string }> = {
    FULL: { backgroundColor: 'var(--ds-color-danger-base-default)' },
    MANY: { backgroundColor: 'var(--ds-color-warning-base-default)' },
    FEW: { backgroundColor: 'var(--ds-color-base-default)' }, // TODO: Our base-default color is green due to the theme
    BLOCKED: { backgroundColor: 'var(--ds-color-neutral-border-subtle)' },
    NONE: { backgroundColor: 'var(--ds-color-base-background)' },
  }

  const sharedStyles = {
    color: 'white',
    borderRadius: '8px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 'var(--ds-size-10)', alignItems: 'center' }}>
      <AkselDatePicker.Standalone
        // @ts-expect-error: Allow custom "modifiers" prop for color coding
        modifiers={{ full, many, few, blocked }}
        modifiersStyles={{
          full: { ...statusColors.FULL, ...sharedStyles },
          many: { ...statusColors.MANY, ...sharedStyles },
          few: { ...statusColors.FEW, ...sharedStyles },
          blocked: {
            ...statusColors.BLOCKED,
            ...sharedStyles,
            textDecoration: 'line-through',
          },
        }}
        style={{
          padding: '20px 16px',
          boxShadow: 'var(--ds-shadow-md)',
          borderRadius: '8px',
        }}
        {...props}
      />

      {showColorCodingExplanation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-size-2)' }}>
          {Object.entries(DayStatus).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-size-4)' }}>
              <div
                style={{
                  display: 'inline-block',
                  width: '30px',
                  height: '30px',
                  borderRadius: '3px',
                  ...(key === 'NONE' ? { border: '1px solid black' } : {}),
                  ...statusColors[key as keyof typeof statusColors],
                }}
              />
              <Paragraph data-size='xs'>{key === 'BLOCKED' ? value + ' dato' : value}</Paragraph>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
