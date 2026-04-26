import { DatePicker as AkselDatePicker } from '@navikt/ds-react'
import type { CalendarDates } from '@ssbno-statreg/shared'

type DatePickerProps = React.ComponentProps<typeof AkselDatePicker.Standalone> & {
  calendarDates: CalendarDates
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
      // @ts-expect-error modifiers passes through to React's DayPicker
      modifiers={{ full, more, few }}
      modifiersStyles={modifiersStyles}
      disabled={blocked}
      {...props}
    />
  )
}

function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const modifiersStyles = {
  full: { backgroundColor: 'var(--ds-color-danger-base-default)', color: 'white' },
  more: { backgroundColor: 'var(--ds-color-warning-base-default)', color: 'white' },
  few: { backgroundColor: 'var(--ds-color-success-base-default)', color: 'white' },
}
