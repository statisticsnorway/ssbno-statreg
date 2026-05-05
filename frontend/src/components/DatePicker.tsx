import './DatePicker.css'

import '@navikt/ds-css/dist/global/tokens.css'
import '@navikt/ds-css/dist/components.css'

import { useState, useEffect } from 'react'
import { DatePicker as AkselDatePicker } from '@navikt/ds-react/DatePicker'
import { type CalenderDate, DayStatus } from '@ssbno-statreg/shared'
import { Paragraph } from '@digdir/designsystemet-react'

import client from '../api'

type DatePickerProps = React.ComponentProps<typeof AkselDatePicker.Standalone> & {
  showColorCodingExplanation?: boolean
}

function formatDate(date: Date | undefined): string {
  if (!date) return ''
  return date.toISOString().slice(0, 10)
}

export function DatePicker({ showColorCodingExplanation, ...props }: DatePickerProps) {
  const [calendarDates, setCalendarDates] = useState<CalenderDate>({})
  const { fromDate, toDate } = props

  useEffect(() => {
    async function fetchCalendarDates() {
      const { data, error } = await client.GET('/calendar', {
        params: { query: { fromDate: formatDate(fromDate), toDate: formatDate(toDate) } },
      })
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setCalendarDates(data)
      }
    }
    fetchCalendarDates()
  }, [fromDate, toDate])

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

  const statusColors = {
    FULL: { backgroundColor: 'var(--ds-color-danger-base-default)' },
    MANY: { backgroundColor: 'var(--ds-color-warning-base-default)' },
    FEW: { backgroundColor: 'var(--ds-color-info-border-default)' },
    BLOCKED: { backgroundColor: 'var(--ds-color-neutral-surface-hover )' },
    NONE: { backgroundColor: 'var(--ds-color-accent-background-default)' },
  }

  const sharedStyles = {
    color: 'var(--ds-color-accent-background-default)',
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
          full: { ...statusColors.FULL, ...sharedStyles },
          many: { ...statusColors.MANY, ...sharedStyles },
          few: { ...statusColors.FEW, ...sharedStyles },
          blocked: {
            ...statusColors.BLOCKED,
            borderRadius: sharedStyles.borderRadius,
            textDecoration: 'line-through',
          },
        }}
        {...props}
      />

      {showColorCodingExplanation && (
        <div className='datepicker-explanation'>
          {Object.entries(DayStatus).map(([key, value]) => (
            <div key={key} className='datepicker-explanation-wrapper'>
              <div
                className='datepicker-explanation-colors'
                style={{
                  ...(key === 'NONE' ? { border: '1px solid var(--ds-color-text-default)' } : {}),
                  ...statusColors[key as keyof typeof statusColors],
                }}
              />
              <Paragraph data-size='xs'>{value}</Paragraph>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
