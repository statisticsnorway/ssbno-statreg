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
  return date.toISOString().slice(0,10)
}

export function DatePicker({ showColorCodingExplanation, ...props }: DatePickerProps) {
  const [calendarDates, setCalendarDates] = useState<CalenderDate>({})

  useEffect(() => {
    async function fetchCalendarDates() {
      const { data, error } = await client.GET('/calendar', {
        params: { query: { fromDate: formatDate(props?.fromDate), toDate: formatDate(props?.toDate) } },
      })
      if (error) {
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setCalendarDates(data)
      }
    }
    fetchCalendarDates()
  }, [])

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
              <Paragraph data-size='xs'>{value}</Paragraph>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
