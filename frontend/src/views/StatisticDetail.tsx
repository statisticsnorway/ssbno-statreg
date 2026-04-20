import { useState, useEffect } from 'react'
import { Heading, Paragraph, List, Link, Button, Divider, Details, Card } from '@digdir/designsystemet-react'
import { PersonPencilIcon } from '@navikt/aksel-icons'
import { StatisticStatusTag, statisticStatusCodes, type StatisticStatusCode } from './StatisticStatusTag'
import client from '../api'
import type { StatisticDetails, Variant } from '@ssbno-statreg/shared'

export default function StatisticDetail() {
  const [statistic, setStatistics] = useState<StatisticDetails>({})

  useEffect(() => {
    async function fetchStatistic() {
      const { data, error } = await client.GET('/statistics/{shortname}', { params: { path: { shortname: 'energ' } } })
      if (error) {
        console.log(error)
        alert(error)
      } else {
        setStatistics(data)
      }
    }
    fetchStatistic()
  }, [])

  const statusCode = parseStatisticStatus(statistic.status?.code)
  const englishName = statistic.name_en ?? '-'
  const division = formatDivision(statistic.division)
  const regionLevels = statistic.statistic_region_levels ?? []
  const mainLanguage = formatMainLanguage(statistic.main_language)
  const startYear = formatStartYear(statistic.first_released_at)
  const contacts = formatContacts(statistic.contacts)
  const mockContinuedBy = ['putegjeld', 'k2', 'k3']
  const cancelledVariants = formatCancelledVariants(statistic.variants)

  return (
    <div>
      <Heading>{statistic.name}</Heading>
      <Paragraph variant="short" >{statistic.shortname}</Paragraph>

      {statusCode && <StatisticStatusTag status={statusCode} />}

      <Divider />

      <Paragraph>Velg variant for å melde publiseringsdato</Paragraph>

      <Card>
        <Details>
          <Details.Summary>Kommende publiseringer</Details.Summary>
          <Details.Content>Kommer snart.</Details.Content>
        </Details>
      </Card>

      <Divider />

      <Heading data-size="xs">Engelsk statistikknavn</Heading>
      <Paragraph>{englishName}</Paragraph>

      <Heading data-size="xs">Ansvarlig seksjon</Heading>
      <Paragraph>{division}</Paragraph>

      <Heading data-size="xs">Kontaktpersoner</Heading>
      <Paragraph>Kontaktpersoner kan endres uten godkjenning</Paragraph>
      {(contacts).map((contact) => (
        <Paragraph>{contact}</Paragraph>
      ))}
      <Button variant='tertiary' onClick={() => alert('Rediger kontakter er ikke implementert ennå.')}>
        <PersonPencilIcon /> Rediger kontakt
      </Button>

      <Heading data-size="xs">Videreføres av</Heading>
      {mockContinuedBy.map((shortname) => (
        <Paragraph><Link href="#">{shortname}</Link></Paragraph>
      ))}

      <Heading data-size="xs">Regionale nivåer</Heading>
      <List.Unordered>
        {regionLevels.map((level) => (
          <List.Item >{level.name} </List.Item>
        ))}
      </List.Unordered>

      <Heading data-size="xs">Målform</Heading>
      <Paragraph>{mainLanguage}</Paragraph>

      <Heading data-size="xs">Statistikkens startår</Heading>
      <Paragraph>{startYear}</Paragraph>

      <Heading data-size="xs">Opphørte varianter</Heading>
      <List.Unordered>
        {cancelledVariants.map((variant) => (
          <List.Item>{variant}</List.Item>
        ))}
      </List.Unordered>

      <Heading data-size="xs">Endringer</Heading>
      <Paragraph><Link href="#">Se versjonshistorikken til statistikken</Link></Paragraph>
    </div>
  )
}

function parseStatisticStatus(code?: string): StatisticStatusCode | null {
  if (!code) return null
  return statisticStatusCodes.find(c => c === code) ?? null
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

function formatCancelledVariants(variants: StatisticDetails['variants']): string[] {
  if (!variants) return []
  return variants
    .filter((variant) => variant.cancelled)
    .map(formatVariant)
}

function formatVariant(variant: Variant): string {
  const detail = variant.level_of_detail?.name ?? '-'
  const frequency = variant.frequency?.name ?? '-'
  const revision = formatRevisionName(variant.revision)
  return `${detail}, ${frequency}, ${revision}`
}

function formatRevisionName(revision?: string): string {
  if (!revision || !(revision in revisionNames)) return '-'
  return revisionNames[revision]
}

const revisionNames: Record<string, string> = {
  I: 'Ingen',
  B: 'Beregnede',
  E: 'Endelige',
  F: 'Foreløpige',
  R: 'Reviderte',
  IG: 'Integrert',
}

function formatContacts(contacts: StatisticDetails['contacts']): string[] {
  if (!contacts) return []
  return contacts.map((contact) => {
    const name = contact.name ?? '-'
    const initials = contact.email ? contact.email.split('@')[0] : '-'
    return `${name} (${initials})`
  })
}