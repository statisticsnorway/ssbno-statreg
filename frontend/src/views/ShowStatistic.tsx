import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { Heading, Paragraph, List, Link, Button, Divider, Details, Card } from '@digdir/designsystemet-react'
import { PersonPencilIcon } from '@navikt/aksel-icons'
import { StatisticStatusTag } from '../components/StatisticStatusTag'
import { VariantCard } from '../components/VariantCard'
import client from '../api'
import { StatisticStatus, type RegionLevel, type StatisticDetails, type Variant } from '@ssbno-statreg/shared'

import './ShowStatistic.css'
import { formatVariant } from '../lib/utils'

export default function ShowStatistic() {
  const [statistic, setStatistic] = useState<StatisticDetails>({})
  const { shortname } = useParams()

  useEffect(() => {
    async function fetchStatistic() {
      const { data, error } = await client.GET('/statistics/{shortname}', {
        params: { path: { shortname: shortname as string } },
      })
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setStatistic(data)
      }
    }
    fetchStatistic()
  }, [shortname])

  const statusCode = statistic.status?.code as keyof typeof StatisticStatus
  const englishName = statistic.name_en ?? '-'
  const division = formatDivision(statistic.division)
  const regionLevels = statistic.statistic_region_levels ?? []
  const mainLanguage = formatMainLanguage(statistic.main_language)
  const startYear = formatStartYear(statistic.first_released_at)
  const contacts = formatContacts(statistic.contacts)
  const mockContinuedBy = ['putegjeld', 'k2', 'k3']
  const variants = statistic.variants ?? []
  const cancelledVariants = formatCancelledVariants(variants)
  const activeVariants = variants.filter((v) => !v.cancelled)

  if (!shortname) return null

  return (
    <>
      <div>
        <Heading level={1}>{statistic.name}</Heading>
        <Paragraph variant='short'>{statistic.shortname}</Paragraph>
        {statusCode && <StatisticStatusTag status={statusCode} />}
      </div>

      <Divider />

      <div style={{ width: '100%' }}>
        <Heading data-size='xs'>Varianter</Heading>
        <Paragraph>Velg variant for å melde publiseringsdato</Paragraph>
        <div className='show-statistic-variants-container'>
          {activeVariants.map((variant) => (
            <VariantCard key={variant.id} shortname={shortname} variant={variant} />
          ))}
        </div>
        <Card>
          <Details>
            <Details.Summary>Kommende publiseringer</Details.Summary>
            <Details.Content>Kommer snart.</Details.Content>
          </Details>
        </Card>
        {cancelledVariants.length > 0 && (
          <Card style={{ marginTop: 'var(--ds-size-6)' }}>
            <Details>
              <Details.Summary>Opphørte varianter</Details.Summary>
              <Details.Content>
                <List.Unordered>
                  {cancelledVariants.map((variant) => (
                    <List.Item key={variant}>{variant}</List.Item>
                  ))}
                </List.Unordered>
              </Details.Content>
            </Details>
          </Card>
        )}
      </div>

      <Divider />

      <div>
        <Heading data-size='xs'>Engelsk statistikknavn</Heading>
        <Paragraph>{englishName}</Paragraph>
      </div>

      <div>
        <Heading data-size='xs'>Ansvarlig seksjon</Heading>
        <Paragraph>{division}</Paragraph>
      </div>

      <div>
        <Heading data-size='xs'>Kontaktpersoner</Heading>
        <Paragraph>Kontaktpersoner kan endres uten godkjenning</Paragraph>
        {contacts.map((contact) => (
          <Paragraph key={contact}>{contact}</Paragraph>
        ))}
        <Button variant='tertiary' onClick={() => alert('Rediger kontakter er ikke implementert ennå.')}>
          <PersonPencilIcon /> Rediger kontakt
        </Button>
      </div>

      <div>
        <Heading data-size='xs'>Videreføres av</Heading>
        {mockContinuedBy.map((shortname) => (
          <Paragraph key={shortname}>
            <Link href='#'>{shortname}</Link>
          </Paragraph>
        ))}
      </div>

      <div>
        <Heading data-size='xs'>Regionale nivåer</Heading>
        <List.Unordered>
          {regionLevels.map((level: RegionLevel) => (
            <List.Item key={level.name}>{level.name} </List.Item>
          ))}
        </List.Unordered>
      </div>

      <div>
        <Heading data-size='xs'>Målform</Heading>
        <Paragraph>{mainLanguage}</Paragraph>
      </div>

      <div>
        <Heading data-size='xs'>Statistikkens startår</Heading>
        <Paragraph>{startYear}</Paragraph>
      </div>

      <div>
        <Heading data-size='xs'>Endringer</Heading>
        <Paragraph>
          <Link href='#'>Se versjonshistorikken til statistikken</Link>
        </Paragraph>
      </div>
    </>
  )
}

function formatMainLanguage(language?: string): string {
  if (!language) return '-'
  if (language === 'nb') return 'Bokmål'
  if (language === 'nn') return 'Nynorsk'
  return language
}

function formatDivision(division: StatisticDetails['division']): string {
  if (!division?.name) return '-'
  if (!division.code) return division.name
  return `${division.name} (${division.code})`
}

function formatStartYear(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).getFullYear().toString()
}

function formatCancelledVariants(variants: Variant[]): string[] {
  if (!variants) return []
  return variants.filter((variant: Variant) => variant.cancelled).map(formatVariantDetails)
}

function formatVariantDetails(variant: Variant): string {
  const detail = variant.level_of_detail?.name ?? '-'
  return `${detail}, ${formatVariant(variant)}`
}

function formatContacts(contacts: StatisticDetails['contacts']): string[] {
  if (!contacts) return []
  return contacts.map((contact) => {
    const name = contact.name ?? '-'
    const initials = contact.email ? contact.email.split('@')[0] : '-'
    return `${name} (${initials})`
  })
}
