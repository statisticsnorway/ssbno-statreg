import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link as ReactRouterLink } from 'react-router'
import { Heading, Paragraph, List, Link, Button, Divider, Details, Card, Table } from '@digdir/designsystemet-react'
import { PencilWritingIcon, PersonPencilIcon } from '@navikt/aksel-icons'
import { StatisticStatusTag } from '../components/StatisticStatusTag'
import { VariantCard } from '../components/VariantCard'
import client from '../api'
import {
  StatisticStatus,
  type RegionLevel,
  type ReleaseListing,
  type StatisticDetails,
  type Variant,
} from '@ssbno-statreg/shared'

import './ShowStatistic.css'
import { formatContacts, formatPublishTime, formatRevisionName, formatVariant } from '../lib/utils'
import { ApprovalStatusBadge } from '../components/ApprovalStatus'
import { useAuth } from '../context/AuthContext'
import { ErrorAlert } from '../components/ErrorAlert'

type ReleaseRowProps = {
  release: ReleaseListing
}

const TABLE_HEADER_CELLS = [{ label: 'Dato' }, { label: 'Variant' }, { label: 'Status' }]

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

function SimpleReleasesTable({ releases }: { releases: ReleaseListing[] }) {
  return (
    <Table>
      <Table.Head>
        <Table.Row>
          {TABLE_HEADER_CELLS.map(({ label }) => (
            <Table.HeaderCell key={label}>{label}</Table.HeaderCell>
          ))}
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {releases?.map((release) => (
          <SimpleReleaseRow key={`${release.publish_time}-${release.id}`} release={release} />
        ))}
      </Table.Body>
    </Table>
  )
}

function SimpleReleaseRow({ release }: ReleaseRowProps) {
  const navigate = useNavigate()
  return (
    <Table.Row
      key={`${release.publish_time}-${release.id}`}
      onClick={() => {
        navigate(`/publisering/${release.id}`, {})
      }}
      className='selectable-row'
    >
      <Table.Cell>{formatPublishTime(release.publish_time)}</Table.Cell>
      <Table.Cell>
        {release.frequency?.name ?? ''}, {formatRevisionName(release.revision?.code).toLocaleLowerCase()}
      </Table.Cell>
      <Table.Cell className='status-column'>
        <ApprovalStatusBadge status={release.approval_status} />
      </Table.Cell>
    </Table.Row>
  )
}

export default function ShowStatistic() {
  const [statistic, setStatistic] = useState<StatisticDetails>({})
  const [releases, setReleases] = useState<ReleaseListing[]>([])
  const { shortname } = useParams()
  const { auth } = useAuth()
  const [apiError, setApiError] = useState<string[]>([])

  useEffect(() => {
    async function fetchStatistic() {
      const { data, error } = await client.GET('/statistics/{shortname}', {
        params: { path: { shortname: shortname as string } },
      })

      if (error) {
        setApiError((prev) => [...prev, error.message])
        return
      }

      setStatistic(data)
    }

    async function fetchReleases(shortname: string) {
      const { data, error } = await client.GET('/releases', {
        params: { query: { shortname, count: 100, publish_time_after: new Date().toISOString() } },
      })

      if (error) {
        setApiError((prev) => [...prev, error.message])
        return
      }

      setReleases(data.releases ?? [])
    }
    fetchStatistic()
    if (shortname) fetchReleases(shortname)
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
      {apiError.length > 0 && <ErrorAlert message={apiError} />}
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
          <Details defaultOpen>
            <Details.Summary>Kommende publiseringer</Details.Summary>
            <Details.Content>
              {releases?.length ? (
                <>
                  <SimpleReleasesTable releases={releases} />
                  <p>
                    <Link href={`/statistikkregisteret/?shortname=${shortname}`}>
                      Se alle publiseringsdatoene for denne statistikken
                    </Link>
                  </p>
                </>
              ) : (
                <Paragraph>Ingen kommende publiseringer.</Paragraph>
              )}
            </Details.Content>
          </Details>
        </Card>
        {!!cancelledVariants.length && (
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

      <div className='show-statistic-contacts-container'>
        <Heading data-size='xs'>Kontaktpersoner</Heading>
        <Paragraph>Kontaktpersoner kan endres uten godkjenning</Paragraph>
        {contacts.map((contact) => (
          <Paragraph key={contact}>{contact}</Paragraph>
        ))}
        {!auth?.isAdmin && (
          <Button
            variant='tertiary'
            className='edit-contact-button'
            onClick={() => alert('Rediger kontakter er ikke implementert ennå.')}
          >
            <PersonPencilIcon /> Rediger kontakt
          </Button>
        )}
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

      {auth?.isAdmin && (
        <div>
          <Button variant='tertiary' asChild>
            <ReactRouterLink to={`/statistikk/${shortname}/rediger`} reloadDocument>
              <PencilWritingIcon /> Rediger
            </ReactRouterLink>
          </Button>
        </div>
      )}
    </>
  )
}
