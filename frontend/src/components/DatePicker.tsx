import '@navikt/ds-css/dist/global/tokens.css'
import '@navikt/ds-css/dist/components.css'

import { DatePicker as AkselDatePicker } from '@navikt/ds-react/DatePicker'
import type { CalendarDates } from '@ssbno-statreg/shared'

type DatePickerProps = React.ComponentProps<typeof AkselDatePicker.Standalone> & {
  calendarDates: CalendarDates
}

function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function DatePicker({ calendarDates, ...props }: DatePickerProps) {
  const full: Date[] = []
  const more: Date[] = []
  const few: Date[] = []
  const blocked: Date[] = []

  for (const [dateString, value] of Object.entries(calendarDates)) {
    const date = parseDate(dateString)
    if (value.status === 'full') full.push(date)
    else if (value.status === 'more') more.push(date)
    else if (value.status === 'few') few.push(date)
    else if (value.status === 'blocked') blocked.push(date)
  }

  return (
    <AkselDatePicker.Standalone
      // @ts-expect-error: Allow custom "modifiers" prop for color coding
      modifiers={{ full, more, few, blocked }}
      modifiersStyles={{
        full: { backgroundColor: 'var(--ds-color-danger-base-default)', color: 'white' },
        more: { backgroundColor: 'var(--ds-color-warning-base-default)', color: 'white' },
        few: { backgroundColor: 'var(--ds-color-success-base-default)', color: 'white' },
        blocked: { backgroundColor: 'var(--ds-color-neutral-border-subtle)', textDecoration: 'line-through' }
      }}
      style={{
        padding: '20px 16px',
        boxShadow: 'var(--ds-shadow-md)',
        borderRadius: '8px',
      }}
      {...props}
    />
  )
}
