import { Card, Heading, Link, Paragraph } from '@digdir/designsystemet-react'

export function VariantCard({ test }: { test: string }) {
  return (
    <Card data-color='neutral' variant='tinted' style={{ width: '448px', height: '180px' }}>
      <Card.Block>
        <Heading>
          <Link href='/statistikkregisteret/statistikk/energ/1/opprett' target='_blank' rel='noopener noreferrer'>
            Frekvens, revisjon
          </Link>
        </Heading>
        <Paragraph>Detaljnivå: {test}</Paragraph>
        <Paragraph>Engelsk detaljnivå:</Paragraph>
      </Card.Block>
    </Card>
  )
}
