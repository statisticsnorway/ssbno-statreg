import '@navikt/ds-css/dist/global/tokens.css'
import '@navikt/ds-css/dist/components.css'

import { DatePicker as AkselDatePicker } from '@navikt/ds-react/DatePicker'
import { type CalenderDate, DayStatus } from '@ssbno-statreg/shared'
import { Paragraph } from '@digdir/designsystemet-react'

type DatePickerProps = React.ComponentProps<typeof AkselDatePicker.Standalone> & {
  calendarDates: CalenderDate
  showColorCoding?: boolean
}

function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function DatePicker({ calendarDates, showColorCoding, ...props }: DatePickerProps) {
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

  const statusStyles: Record<Exclude<keyof typeof DayStatus, 'NONE'>, { backgroundColor: string }> = {
    FULL: { backgroundColor: 'var(--ds-color-danger-base-default)' },
    MANY: { backgroundColor: 'var(--ds-color-warning-base-default)' },
    FEW: { backgroundColor: 'var(--ds-color-success-base-default)' },
    BLOCKED: { backgroundColor: 'var(--ds-color-neutral-border-subtle)' },
  }

  const sharedStyles = {
    color: 'white',
    borderRadius: '8px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 'var(--ds-size-8)' }}>
      <AkselDatePicker.Standalone
        // @ts-expect-error: Allow custom "modifiers" prop for color coding
        modifiers={{ full, many, few, blocked }}
        modifiersStyles={{
          full: { ...statusStyles.FULL, ...sharedStyles },
          many: { ...statusStyles.MANY, ...sharedStyles },
          few: { ...statusStyles.FEW, ...sharedStyles },
          blocked: {
            backgroundColor: 'var(--ds-color-neutral-border-subtle)',
            textDecoration: 'line-through',
            ...sharedStyles,
          },
        }}
        style={{
          padding: '20px 16px',
          boxShadow: 'var(--ds-shadow-md)',
          borderRadius: '8px',
        }}
        {...props}
      />
      {showColorCoding && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-size-2)' }}>
          {Object.entries(DayStatus).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-size-4)' }}>
              <div
                style={{
                  display: 'inline-block',
                  width: '30px',
                  height: '30px',
                  ...(key === 'NONE' ? { border: '1px solid black' } : {}),
                  ...statusStyles[key as keyof typeof statusStyles],
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
