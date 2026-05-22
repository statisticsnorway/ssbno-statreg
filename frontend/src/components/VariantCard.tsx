import { Card, Heading, Link, Paragraph } from '@digdir/designsystemet-react'
import { type Variant } from '@ssbno-statreg/shared'

export function VariantCard({ shortname, variant }: { shortname: string; variant: Variant }) {
  return (
    <Card data-color='neutral' variant='tinted' style={{ height: '180px' }}>
      <Card.Block>
        <Heading>
          <Link href={`/statistikkregisteret/statistikk/${shortname}/${variant.id}/opprett`}>
            {variant.frequency?.name}, {variant.revision}
          </Link>
        </Heading>
        <Paragraph>
          Detaljnivå: {variant.level_of_detail?.name} <br />
          Engelsk detaljnivå: {variant.level_of_detail?.name_en}
        </Paragraph>
      </Card.Block>
    </Card>
  )
}
