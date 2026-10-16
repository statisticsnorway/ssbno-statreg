import { ErrorSummary } from '@statisticsnorway/design-react'

type ErrorDisplayerProps = {
  errors: Record<string, string | undefined>
}

export default function ErrorDisplayer({ errors }: Readonly<ErrorDisplayerProps>) {
  return (
    Object.values(errors).some(Boolean) && (
      <ErrorSummary>
        <ErrorSummary.Heading>For å gå videre må du rette opp følgende feil:</ErrorSummary.Heading>
        <ErrorSummary.List>
          {Object.entries(errors).map(([key, message]) => {
            if (message) {
              return (
                <ErrorSummary.Item key={key}>
                  <ErrorSummary.Link href={`#${key}`}>{message}</ErrorSummary.Link>
                </ErrorSummary.Item>
              )
            }
          })}
        </ErrorSummary.List>
      </ErrorSummary>
    )
  )
}
