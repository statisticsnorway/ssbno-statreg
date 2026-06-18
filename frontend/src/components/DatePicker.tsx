import './DatePicker.css'

import '@navikt/ds-css/dist/global/tokens.css'
import '@navikt/ds-css/dist/components.css'

import { useState, useEffect } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DatePicker as AkselDatePicker } from '@navikt/ds-react/DatePicker'
import { type CalenderDate, DayStatus } from '@ssbno-statreg/shared'
import { Paragraph } from '@digdir/designsystemet-react'
import { CircleIcon, CircleFillIcon } from '@navikt/aksel-icons'

import client from '../api'
import { getDateOnlyAsString } from '../lib/utils'

type DatePickerProps = React.ComponentProps<typeof AkselDatePicker.Standalone> & {
  showColorCodingExplanation?: boolean
  calendarDatesEmit?: (data: CalenderDate) => void
}

const fewStatusBackgroundImage = `url("data:image/svg+xml,${encodeURIComponent(
  renderToStaticMarkup(<CircleIcon aria-hidden width={8} height={8} />)
)}")`
const fullStatusBackgroundImage = `url("data:image/svg+xml,${encodeURIComponent(
  renderToStaticMarkup(<CircleFillIcon aria-hidden width={8} height={8} />)
)}")`

export const DatePickerStatusColors = {
  FULL: {
    backgroundColor: '#FFCDD2',
    backgroundPosition: 'top 6px left 6px',
    backgroundRepeat: 'no-repeat',
    backgroundImage: fullStatusBackgroundImage,
  },
  MANY: {
    backgroundColor: '#FFE0B2',
    backgroundPosition: 'top 6px left 6px',
    backgroundRepeat: 'no-repeat',
  },
  FEW: {
    backgroundColor: '#CCE1FF',
    backgroundPosition: 'top 6px left 6px',
    backgroundRepeat: 'no-repeat',
    backgroundImage: fewStatusBackgroundImage,
  },
  BLOCKED: {
    backgroundColor: 'var(--ds-color-neutral-surface-tinted)',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  },
  NONE: { backgroundColor: 'var(--ds-color-accent-background-default)' },
}

export function DatePickerColorLegend({ statusColors }: Readonly<{ statusColors: typeof DatePickerStatusColors }>) {
  return (
    <div className='datepicker-explanation'>
      {Object.entries(DayStatus).map(([key, value]) => (
        <div key={key} className='datepicker-explanation-wrapper'>
          <div
            className='datepicker-explanation-colors'
            style={{
              ...(key === 'NONE' ? { border: '1px solid var(--ds-color-text-default)' } : {}),
              ...statusColors[key as keyof typeof DatePickerStatusColors],
            }}
          />
          <Paragraph data-size='xs'>{value}</Paragraph>
        </div>
      ))}
    </div>
  )
}

export function DatePicker({ showColorCodingExplanation, calendarDatesEmit, ...props }: DatePickerProps) {
  const [calendarDates, setCalendarDates] = useState<CalenderDate>({})
  const displayedMonth = props.month

  useEffect(() => {
    async function fetchCalendarDates() {
      if (!displayedMonth) return
      const from = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1)
      const to = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 0)
      const { data, error } = await client.GET('/calendar', {
        params: {
          query: { fromDate: getDateOnlyAsString(from), toDate: getDateOnlyAsString(to) },
        },
      })
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setCalendarDates(data)
        calendarDatesEmit?.(data)
      }
    }
    fetchCalendarDates()
  }, [displayedMonth, calendarDatesEmit])

  const full: Date[] = []
  const many: Date[] = []
  const few: Date[] = []
  const blocked: Date[] = []

  for (const [dateString, value] of Object.entries(calendarDates)) {
    const date = new Date(dateString)

    if (value.status === 'FULL') full.push(date)
    else if (value.status === 'MANY') many.push(date)
    else if (value.status === 'FEW') few.push(date)
    else if (value.status === 'BLOCKED') blocked.push(date)
  }

  const sharedStyles = {
    borderRadius: '8px',
    boxShadow: 'inset 0 0 0 2px var(--ds-color-accent-background-default)',
  }

  return (
    <div className='datepicker-container'>
      <AkselDatePicker.Standalone
        className='datepicker-wrapper'
        // @ts-expect-error: Allow custom "modifiers" prop for color coding
        modifiers={{ full, many, few, blocked }}
        modifiersStyles={{
          full: { ...DatePickerStatusColors.FULL, ...sharedStyles },
          many: { ...DatePickerStatusColors.MANY, ...sharedStyles },
          few: { ...DatePickerStatusColors.FEW, ...sharedStyles },
          blocked: {
            ...DatePickerStatusColors.BLOCKED,
            borderRadius: sharedStyles.borderRadius,
            textDecoration: 'line-through',
          },
        }}
        {...props}
      />

      {showColorCodingExplanation && <DatePickerColorLegend statusColors={DatePickerStatusColors} />}
    </div>
  )
}
