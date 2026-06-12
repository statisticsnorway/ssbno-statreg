import { Heading } from '@digdir/designsystemet-react'

export const ErrorType = {
  NOTAUTH: 'not_authenticated',
  NOTFOUND: 'not_found',
} as const

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType]

type ErrorPageProps = Readonly<{
  type: ErrorType
}>

const errorMessages: Record<ErrorType, string> = {
  [ErrorType.NOTAUTH]: 'Du har ikke tilgang til å bruke denne siden. Kontakt desken om du mener dette er en feil.',
  [ErrorType.NOTFOUND]: 'Innholdet du prøver å vise finnes ikke',
}

export default function ErrorPage({ type }: ErrorPageProps) {
  return (
    <>
      <Heading level={1} data-size='xl'>
        En feil har oppstått
      </Heading>

      <p className='ds-paragraph' data-variant='default' data-size='xl'>
        {errorMessages[type]}
      </p>
    </>
  )
}
