import { Card, Heading, Link, Paragraph } from '@statisticsnorway/design-react'
import { type Variant } from '@ssbno-statreg/shared'
import { formatVariant } from '../lib/utils'

export function VariantCard({ shortname, variant }: { shortname: string; variant: Variant }) {
  return (
    <Card variant='tinted' style={{ height: '180px' }}>
      <Card.Block>
        <Heading>
          <Link href={`/statistikkregisteret/statistikk/${shortname}/${variant.id}/opprett`}>
            {formatVariant(variant)}
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
