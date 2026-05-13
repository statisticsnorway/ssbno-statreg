import { Card, Heading, Link, Paragraph } from '@digdir/designsystemet-react'

export function VariantCard({ test }: { test: string }) {
  return (
    <Card data-color='neutral'>
      <Card.Block>
        <Heading>
          <Link href='https://designsystemet.no' target='_blank' rel='noopener noreferrer'>
            Myrkheim Museum
          </Link>
        </Heading>
        <Paragraph>
          Myrkheim Museum ligg i dalen mellom dei gamle fjelltoppane og viser utstillingar frå tida då dei fyrste
          reisefølgja kryssa landet. Her kan du utforske eldgamle kart, reiskapar frå dei store vandringane og
          forteljingar bevart av skogvaktarane.
        </Paragraph>
        <Paragraph data-size='sm'>{test}</Paragraph>
      </Card.Block>
    </Card>
  )
}
