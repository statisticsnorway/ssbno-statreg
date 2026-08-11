import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link as ReactRouterLink } from 'react-router'
import {
  Heading,
  Paragraph,
  List,
  Link,
  Button,
  Divider,
  Details,
  Card,
  Table,
  ValidationMessage,
  ErrorSummary,
  Field,
} from '@digdir/designsystemet-react'
import { PencilWritingIcon } from '@navikt/aksel-icons'
import { StatisticStatusTag } from '../components/StatisticStatusTag'
import { VariantCard } from '../components/VariantCard'
import client from '../api'
import {
  StatisticStatus,
  type Contact,
  type RegionLevel,
  type ReleaseListing,
  type StatisticDetails,
  type Variant,
} from '@ssbno-statreg/shared'

import './ShowStatistic.css'
import { formatContact, formatDateTime, formatRevisionName, formatVariant } from '../lib/utils'
import { ApprovalStatusBadge } from '../components/ApprovalStatus'
import { useAuth } from '../context/AuthContext'
import { ErrorAlert } from '../components/ErrorAlert'
import { ContactSelection } from '../components/ContactSelection'

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
      <Table.Cell>{formatDateTime(release.publish_time)}</Table.Cell>
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
  const [allContacts, setAllContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [isEditingContacts, setIsEditingContacts] = useState(false)
  const [contactValidationError, setContactValidationError] = useState(false)
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
      setSelectedContacts(data.contacts?.map((c) => c.principalName) ?? [])
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

  useEffect(() => {
    async function fetchContacts() {
      const { data, error } = await client.GET('/contacts')

      if (error) {
        setApiError((prev) => [...prev, error.message])
        return
      }

      setAllContacts(data ?? [])
    }
    fetchContacts()
  }, [])

  async function saveContacts() {
    if (!shortname) return

    if (statusCode === 'A' && selectedContacts.length === 0) {
      setContactValidationError(true)
      return
    }

    setContactValidationError(false)

    const { data, error } = await client.PUT('/statistics/{shortname}/contacts', {
      params: { path: { shortname } },
      body: selectedContacts,
    })

    if (error) {
      setApiError((prev) => [...prev, error.message])
      return
    }

    setStatistic((prev) => ({ ...prev, contacts: data }))
    setIsEditingContacts(false)
  }

  const statusCode = statistic.status?.code as keyof typeof StatisticStatus
  const englishName = statistic.name_en ?? '-'
  const division = formatDivision(statistic.division)
  const regionLevels = statistic.statistic_region_levels ?? []
  const mainLanguage = formatMainLanguage(statistic.main_language)
  const startYear = formatStartYear(statistic.first_released_at)
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
        <div className='show-statistic-contacts-heading'>
          <Heading data-size='xs'>Kontaktpersoner</Heading>
          {!auth?.isAdmin && !isEditingContacts && (
            <Button
              variant='tertiary'
              data-size='sm'
              aria-label='Rediger kontakter'
              onClick={() => setIsEditingContacts(true)}
            >
              <PencilWritingIcon aria-hidden />
            </Button>
          )}
        </div>
        <Paragraph>Navn vises under overskriften 'Kontakt' på statistikksiden på ssb.no</Paragraph>
        <div className='show-statistic-contacts-content'>
          {!isEditingContacts &&
            statistic.contacts?.map((contact) => (
              <Paragraph key={contact.principalName}>
                <Link href='#' onClick={() => alert('Kontaktside ikke implementert')}>
                  {formatContact(contact)}
                </Link>
              </Paragraph>
            ))}
          {isEditingContacts && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                saveContacts()
              }}
            >
              <Field id='contact-selection'>
                <ContactSelection
                  contacts={allContacts}
                  selected={selectedContacts}
                  setSelected={setSelectedContacts}
                />
                {contactValidationError && selectedContacts.length === 0 && (
                  <ValidationMessage>Legg til minst én kontakt</ValidationMessage>
                )}
              </Field>
              {contactValidationError && selectedContacts.length === 0 && (
                <div className='show-statistic-contacts-error-summary'>
                  <ErrorSummary>
                    <ErrorSummary.Heading>For å gå videre må du rette opp følgende feil:</ErrorSummary.Heading>
                    <ErrorSummary.List>
                      <ErrorSummary.Item>
                        <ErrorSummary.Link href='#contact-selection'>Legg til minst én kontakt</ErrorSummary.Link>
                      </ErrorSummary.Item>
                    </ErrorSummary.List>
                  </ErrorSummary>
                </div>
              )}
              <div className='show-statistic-contacts-button-wrapper'>
                <Button type='submit'>Lagre</Button>
                <Button variant='tertiary' onClick={() => setIsEditingContacts(false)}>
                  Avbryt
                </Button>
              </div>
            </form>
          )}
        </div>
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
          <Link href={`/statistikkregisteret/statistikk/${shortname}/versjoner`}>
            Se versjonshistorikken til statistikken
          </Link>
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
