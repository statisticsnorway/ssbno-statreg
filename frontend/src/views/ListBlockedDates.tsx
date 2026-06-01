import { Heading, Link, Paragraph } from '@digdir/designsystemet-react'
import { ArrowLeftIcon } from '@navikt/aksel-icons'
import { Link as ReactRouterLink } from 'react-router'

export default function ListBlockedDates() {
  return (
    <>
      <Link asChild>
        <ReactRouterLink to='/publisering'>
          <ArrowLeftIcon /> Tilbake til publiseringsoversikten
        </ReactRouterLink>
      </Link>
      <div>
        <Heading data-size='sm' style={{ marginBottom: 'var(--ds-size-4)' }}>Sperrede datoer</Heading>
        <Paragraph>Datoer som er automatisk lagt inn kan ikke redigeres eller slettes</Paragraph>
      </div>
    </>
  )
}
