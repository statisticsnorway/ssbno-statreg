import { Heading } from '@digdir/designsystemet-react'

export const errorType = {
  NOTAUTH: 'not_authenticated',
  NOTFOUND: 'not_found',
} as const

function getErrorMessage(error: string) {
  switch (error) {
    case errorType.NOTAUTH:
      return 'Du har ikke tilgang til å bruke denne siden. Kontakt desken om du mener dette er en feil.'
    case errorType.NOTFOUND:
      return 'Innholdet du prøver å vise finnes ikke'
    default:
      return 'Det har oppstått en feil'
  }
}

export function ErrorPage(error: string = '') {
  return (
    <>
      <Heading level={2}>En feil har oppstått</Heading>
      <p>{getErrorMessage(error)}</p>
    </>
  )
}
