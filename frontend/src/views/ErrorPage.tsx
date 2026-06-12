import { Heading } from '@digdir/designsystemet-react'

const ErrorType = {
  NOTAUTH: 'not_authenticated',
  NOTFOUND: 'not_found',
} as const

type ErrorType = (typeof ErrorType)[keyof typeof ErrorType]

type ErrorPageProps = Readonly<{
  type: ErrorType
}>

export { ErrorType as errorType }

function getErrorMessage(error: ErrorType) {
  switch (error) {
    case ErrorType.NOTAUTH:
      return 'Du har ikke tilgang til å bruke denne siden. Kontakt desken om du mener dette er en feil.'
    case ErrorType.NOTFOUND:
      return 'Innholdet du prøver å vise finnes ikke'
    default:
      return 'Det har oppstått en feil'
  }
}

export default function ErrorPage({ type }: ErrorPageProps) {
  return (
    <>
      <Heading level={2}>En feil har oppstått</Heading>
      <p>{getErrorMessage(type)}</p>
    </>
  )
}
