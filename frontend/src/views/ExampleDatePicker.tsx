// TODO this is just an example and should later be removed

import { DatePicker } from './DatePicker'
import type { CalendarDates } from '@ssbno-statreg/shared'

const exampleCalendarDates: CalendarDates = {
  '2026-04-03': { status: 'free' },
  '2026-04-05': { status: 'few' },
  '2026-04-10': { status: 'more' },
  '2026-04-15': { status: 'full' },
  '2026-04-20': { status: 'blocked' },
  '2026-04-25': { status: 'few' },
}

function ExampleDatePicker() {
  return (
    <div>
      <DatePicker
        calendarDates={exampleCalendarDates}
        dropdownCaption
        fromDate={new Date(2025, 0, 1)}
        toDate={new Date(2027, 11, 31)}
      />
    </div>
  )
}

export default ExampleDatePicker