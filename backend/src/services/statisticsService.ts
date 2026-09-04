import {
  type Contact,
  type CreatableStatisticStatus,
  type StatisticDetails,
  type StatisticUpdate,
  type StatisticCreate,
  ApprovalStatus,
  StatisticStatus,
  RevisionNames,
  StatisticListingResponse,
  RequiredCreateStatisticFieldsByStatus,
  RequiredEditStatisticFieldsByStatus,
  Variant,
} from '@ssbno-statreg/shared'
import { dateToISOString, sanitize, parseDateOnly, ensureRequiredFieldsExists, isNumber, parseId } from '@/lib/utils'
import type { Prisma, ResponsiblePerson as ResponsiblePersonPrisma } from '@/generated/prisma/client'
import { getDivisionFromCode } from '@/services/klassService'
import { ExtendedPrismaClient as PrismaClient } from '@/lib/prisma'
import { statisticsAsserts } from '@/lib/asserts'
import { getAllUsersFromCache } from '@/lib/cache'
import { StatregError } from '@/lib/statregError'

export type StatisticPrisma = Pick<PrismaClient, 'statistic' | 'shortname' | 'responsiblePerson' | 'frequency'>

type StatisticStatusCode = keyof typeof StatisticStatus

type ValidatedCreateStatisticInput = {
  division: string
  name: string
  name_en?: string
  first_released_at?: Date
  main_language: string
  statistic_region_levels?: {
    code?: string
  }[]
  comment: string
  contacts?: StatisticCreate['contacts']
  variants?: StatisticCreate['variants']
}

type ValidatedStatisticInput = {
  division: string | null | undefined
  statistic_region_levels?: {
    code?: string
  }[]
  status?: string
  name: string
  name_en: string
  previous_topic_codes?: string
  yearly_reporting?: boolean
  first_released_at: Date | null
  main_language: string
  comment: string
  relation_id?: number | null
  contacts?: StatisticUpdate['contacts']
  variants?: StatisticUpdate['variants']
}

// Statistic listing

export async function getFilteredStatistics(
  {
    start = 0,
    count = 10,
    filterByShortnames,
    filterByContactPrincipalName,
    sort,
  }: {
    start?: number
    count?: number
    filterByShortnames?: string[]
    filterByContactPrincipalName?: string[]
    sort?: string
  },
  prisma: StatisticPrisma
): Promise<StatisticListingResponse> {
  const safeFilterByShortnames = filterByShortnames?.length
    ? filterByShortnames.map((shortname) => sanitize(shortname))
    : undefined

  const where = await buildStatisticFilter(
    { filterByShortnames: safeFilterByShortnames, filterByContactPrincipalName },
    prisma
  )

  return getStatistics({ start, count, where, orderBy: parseStatisticSortQuery(sort) }, prisma)
}

function parseStatisticSortQuery(sort?: string): Prisma.StatisticOrderByWithRelationInput | undefined {
  if (sort === 'shortname') {
    return { shortname: { name: 'asc' } }
  }
  if (sort === '-shortname') {
    return { shortname: { name: 'desc' } }
  }
  return undefined
}

export async function buildStatisticFilter(
  {
    filterByShortnames,
    filterByContactPrincipalName,
  }: { filterByShortnames?: string[]; filterByContactPrincipalName?: string[] },
  prisma: StatisticPrisma
) {
  if (filterByShortnames?.length) {
    await statisticsAsserts.assertFilteredShortnamesExist(filterByShortnames, prisma)
  }

  return {
    ...(filterByShortnames?.length && {
      OR: filterByShortnames.map((shortname) => ({
        shortname: {
          name: shortname,
        },
      })),
    }),
    ...(filterByContactPrincipalName?.length && {
      responsiblePersons: {
        some: {
          principalName: { in: filterByContactPrincipalName },
        },
      },
    }),
  }
}

export async function getStatistics(
  {
    start = 0,
    count = 10,
    where,
    orderBy,
  }: {
    start?: number
    count?: number
    where?: Prisma.StatisticWhereInput
    orderBy?: Prisma.StatisticOrderByWithRelationInput
  },
  prisma: StatisticPrisma
): Promise<StatisticListingResponse> {
  const statistics = await prisma.statistic.findMany({
    skip: start,
    take: count,
    where,
    orderBy,
    select: {
      language: true,
      status: true,
      name: true,
      name_en: true,
      shortname: { select: { name: true } },
      responsiblePersons: { select: { principalName: true } },
      division_code: true,
    },
  })
  const total = await prisma.statistic.count({ where })
  const users = await getAllUsersFromCache()

  return {
    total,
    statistics: statistics.map((statistic) => {
      const main_language = statistic.language
      const divisionCode = statistic.division_code ?? ''
      const contacts = statistic.responsiblePersons.map(({ principalName }) => {
        const user = users[principalName]
        return {
          name: user?.displayName ?? '',
          principalName: principalName,
        }
      })

      return {
        shortname: statistic.shortname.name,
        main_language,
        status: {
          code: parseStatusCode(statistic.status),
        },
        division: {
          name: getDivisionFromCode(divisionCode)?.name,
          code: divisionCode,
        },
        name: statistic.name,
        name_en: statistic.name_en ?? '',
        contacts,
      }
    }),
  }
}

// Statistic details

type StatisticPrismaResult = Prisma.StatisticGetPayload<{ include: typeof StatisticsDetailedIncludes }>

const VariantSelect = {
  omit: { version: true, statistic_id: true, freq_id: true },
  include: {
    frequency: { select: { name: true, code: true } },
  },
}

const StatisticRelationSelect = {
  select: {
    id: true,
    name: true,
    name_en: true,
    status: true,
    related_statistic_id: true,
    shortname: { select: { name: true } },
    incoming_statistic_relations: {
      select: { id: true, status: true },
    },
  },
}

export const StatisticsDetailedIncludes = {
  shortname: { select: { name: true } },
  responsiblePersons: { select: { principalName: true } },
  related_statistic: StatisticRelationSelect,
  incoming_statistic_relations: StatisticRelationSelect,
  statistic_region_levels: {
    select: { region_level: { select: { name: true, code: true } } },
  },
  variants: VariantSelect,
}

export function parseStatisticVariants(
  variants: Prisma.VariantGetPayload<typeof VariantSelect>[] | undefined
): StatisticDetails['variants'] {
  if (!variants?.length) return []

  return variants.map((variant) => ({
    id: variant.id,
    updated_at: dateToISOString(variant.last_updated),
    level_of_detail: {
      name: variant.level_of_detail ?? '',
      name_en: variant.level_of_detail_en ?? '',
    },
    created_at: dateToISOString(variant.date_created),
    cancelled: variant.cancelled,
    frequency: {
      name: variant.frequency.name,
      code: variant.frequency.code,
    },
    revision: {
      code: variant.revision,
    },
  }))
}

export async function mapStatisticDetails(statistic: StatisticPrismaResult): Promise<StatisticDetails> {
  const main_language = statistic.language
  const division_code = statistic.division_code ?? ''

  // A statistic can be merged into another statistic that later also becomes SA, forming a chain
  // (SA1 -> SA2 -> A1). Each statistic only ever exposes its own immediate relation - the full
  // chain becomes visible one step at a time by following it through the UI. Self-links are noise
  // from old data and are never a meaningful relation.
  const directRelation =
    statistic.related_statistic && statistic.related_statistic.id !== statistic.id ? statistic.related_statistic : null
  const incomingCandidates = (statistic.incoming_statistic_relations ?? []).filter(
    (incomingRelation) => incomingRelation.id !== statistic.id
  )

  // "Videreføres av": only for an SA statistic. Once a relation is established it survives later
  // status changes on the target (it may become SA, IA, etc. - see business rules), so the target's
  // current status is never checked here. Old data with no direct id is inferred from a single
  // Active statistic pointing at it the other way around (legacy bug: the id lived on the wrong row).
  const incomingActiveRelations = incomingCandidates.filter((incomingRelation) => incomingRelation.status === 'A')
  const relationTarget =
    statistic.status === 'SA'
      ? (directRelation ?? (incomingActiveRelations.length === 1 ? incomingActiveRelations[0] : null))
      : null
  const relation = relationTarget
    ? {
        id: relationTarget.id,
        shortname: relationTarget.shortname.name,
        name: relationTarget.name,
        name_en: relationTarget.name_en ?? '',
      }
    : {}

  // "Viderefører": canonical relations are incoming SA rows, regardless of this statistic's
  // current status. Also preserve the old reverse-only A -> SA representation on the Active page:
  // if this Active row points to an SA that has no canonical outgoing relation and this row is that
  // SA's single Active reverse candidate, expose the logical SA -> A edge in the same direction as
  // canonical data. Ambiguous or conflicting legacy data is never guessed.
  const canonicalIncomingSaRelations = incomingCandidates.filter((incomingRelation) => incomingRelation.status === 'SA')
  const legacyDirectSaRelation = statistic.status === 'A' && directRelation?.status === 'SA' ? directRelation : null
  const legacySaRelatedStatisticId = legacyDirectSaRelation?.related_statistic_id
  const legacySaHasNoCanonicalRelation =
    legacyDirectSaRelation !== null &&
    (legacySaRelatedStatisticId === null ||
      legacySaRelatedStatisticId === undefined ||
      legacySaRelatedStatisticId === legacyDirectSaRelation.id)
  const legacySaActiveReverseCandidates =
    legacyDirectSaRelation?.incoming_statistic_relations.filter(
      (incomingRelation) => incomingRelation.status === 'A' && incomingRelation.id !== legacyDirectSaRelation.id
    ) ?? []
  const inferredLegacyIncomingSaRelation =
    legacyDirectSaRelation &&
    legacySaHasNoCanonicalRelation &&
    legacySaActiveReverseCandidates.length === 1 &&
    legacySaActiveReverseCandidates[0]?.id === statistic.id
      ? legacyDirectSaRelation
      : null

  const incomingSaRelations = [
    ...canonicalIncomingSaRelations,
    ...(inferredLegacyIncomingSaRelation ? [inferredLegacyIncomingSaRelation] : []),
  ]
  const uniqueIncomingSaRelations = [
    ...new Map(incomingSaRelations.map((incomingRelation) => [incomingRelation.id, incomingRelation])).values(),
  ]
  const incoming_relations = uniqueIncomingSaRelations.map((incomingRelation) => ({
    id: incomingRelation.id,
    shortname: incomingRelation.shortname.name,
    name: incomingRelation.name,
    name_en: incomingRelation.name_en ?? '',
  }))
  const users = await getAllUsersFromCache()

  return {
    version: statistic.version,
    shortname: statistic.shortname.name,
    approval_status: statistic.desk_appoval_status ?? ApprovalStatus.PENDING,
    main_language,
    division: {
      code: division_code,
      name: getDivisionFromCode(division_code)?.name,
    },
    first_released_at: dateToISOString(statistic.first_release),
    yearly_reporting: statistic.yearly_reporting,
    status: {
      code: parseStatusCode(statistic.status),
    },
    previous_topic_codes: statistic.legacy_topic_codes,
    relation,
    incoming_relations,
    name: statistic.name,
    name_en: statistic.name_en ?? '',
    updated_at: dateToISOString(statistic.last_updated),
    comment: statistic.comment,
    created_at: dateToISOString(statistic.date_created),
    variants: parseStatisticVariants(statistic.variants),
    contacts: statistic.responsiblePersons.map(({ principalName }) => {
      const user = users[principalName]
      return {
        name: user?.displayName ?? '',
        principalName: principalName,
      }
    }),
    statistic_region_levels: statistic.statistic_region_levels?.map(({ region_level }) => {
      return { name: region_level.name, code: region_level.code ?? '' }
    }),
  }
}

export async function getStatisticByShortname(shortname: string, prisma: StatisticPrisma): Promise<StatisticDetails> {
  const safeShortname = sanitize(shortname)

  const statistic = await prisma.statistic.findFirst({
    where: { shortname: { name: safeShortname } },
    include: StatisticsDetailedIncludes,
  })
  if (!statistic) throw new StatregError(`Statistic with shortname '${shortname}' not found.`, 404)

  return await mapStatisticDetails(statistic)
}

export async function updateStatistic(
  shortname: string,
  body: StatisticUpdate,
  prisma: StatisticPrisma
): Promise<StatisticDetails> {
  const safeShortname = sanitize(shortname)
  const existingStatistic = await prisma.statistic.findFirst({
    where: { shortname: { name: safeShortname } },
    select: {
      id: true,
      status: true,
      related_statistic_id: true,
      related_statistic: { select: { id: true, status: true } },
      responsiblePersons: { select: { principalName: true } },
      variants: { select: { id: true } },
      statistic_region_levels: { select: { region_level: { select: { code: true, id: true } } } },
    },
  })

  if (!existingStatistic) throw new StatregError(`Shortname ${safeShortname} not found`, 404)

  const requiredFields: (keyof StatisticUpdate)[] =
    RequiredEditStatisticFieldsByStatus[body.status?.code as StatisticStatusCode] ?? []

  const {
    division,
    statistic_region_levels = [],
    status,
    name,
    name_en,
    relation_id,
    previous_topic_codes,
    yearly_reporting,
    first_released_at,
    main_language,
    comment,
    contacts,
    variants,
  } = parseUpdateStatisticInput(body, requiredFields)

  if (existingStatistic.status === 'A' && status === 'K') {
    throw new StatregError('An active statistic cannot be set back to upcoming.')
  }

  // "Target must be Active" only applies when a new SA relation is established or an existing
  // SA deliberately changes target. Existing SA relations survive later target status changes.
  let relationIdToWrite: number | undefined
  if (status === 'SA') {
    const existingDirectRelationId =
      existingStatistic.related_statistic && existingStatistic.related_statistic.id !== existingStatistic.id
        ? existingStatistic.related_statistic.id
        : undefined

    if (existingStatistic.status !== 'SA') {
      // Any transition into SA establishes SA semantics now, so the selected target must be Active
      // even if this row already happened to contain the same related_statistic_id in legacy data.
      if (!relation_id) {
        throw new StatregError("A statistic can only be set to status 'Sammenslått' if it has a relation id.")
      }

      await statisticsAsserts.assertRelationTargetIsActive(relation_id, existingStatistic.id, prisma)
      relationIdToWrite = relation_id
    } else {
      // Existing SA data may also use the old reversed representation where one Active statistic
      // points to this SA. Preserve that representation when the relation is unchanged.
      const legacyRelations = !existingDirectRelationId
        ? await prisma.statistic.findMany({
            where: { status: 'A', related_statistic_id: existingStatistic.id },
            select: { id: true },
          })
        : []
      const existingLegacyRelationId = legacyRelations.length === 1 ? legacyRelations[0]!.id : undefined

      if (relation_id) {
        const relationIsUnchanged =
          relation_id === existingDirectRelationId || relation_id === existingLegacyRelationId

        if (!relationIsUnchanged) {
          await statisticsAsserts.assertRelationTargetIsActive(relation_id, existingStatistic.id, prisma)
          relationIdToWrite = relation_id
        }
      } else if (!existingDirectRelationId && !existingLegacyRelationId) {
        throw new StatregError("A statistic can only be set to status 'Sammenslått' if it has a relation id.")
      }
    }
  }

  // Once the edited statistic stops being SA, clear only its own stored SA relation.
  const clearRelationOnStatusChange = existingStatistic.status === 'SA' && status !== 'SA'

  // Old data can store a merge backwards as A -> SA while the logical/UI relation is SA -> A.
  // If that Active row leaves A, its FK may be reused or cleared and the historical edge would be
  // lost. Detect only the same single, unambiguous reverse-only shape that the read fallback trusts.
  let legacyReverseSourceIdToPreserve: number | undefined
  if (
    existingStatistic.status === 'A' &&
    status !== 'A' &&
    existingStatistic.related_statistic?.status === 'SA' &&
    existingStatistic.related_statistic.id !== existingStatistic.id
  ) {
    const legacyReverseSourceId = existingStatistic.related_statistic.id
    const legacyReverseSource = await prisma.statistic.findFirst({
      where: { id: legacyReverseSourceId },
      select: {
        related_statistic_id: true,
        incoming_statistic_relations: {
          where: { status: 'A' },
          select: { id: true },
        },
      },
    })

    const sourceRelatedStatisticId = legacyReverseSource?.related_statistic_id
    const sourceHasNoCanonicalRelation =
      sourceRelatedStatisticId === null ||
      sourceRelatedStatisticId === undefined ||
      sourceRelatedStatisticId === legacyReverseSourceId
    const activeReverseCandidates = legacyReverseSource?.incoming_statistic_relations ?? []

    if (
      sourceHasNoCanonicalRelation &&
      activeReverseCandidates.length === 1 &&
      activeReverseCandidates[0]!.id === existingStatistic.id
    ) {
      legacyReverseSourceIdToPreserve = legacyReverseSourceId
    }
  }

  let newContacts
  if (contacts) {
    newContacts = await upsertContacts(contacts, prisma)
  }

  const parsedVariants = variants ? await parseVariantsInput(variants, status, prisma) : undefined

  if (parsedVariants) {
    for (const variant of parsedVariants) {
      if (variant.id && !existingStatistic.variants.some((existingVariant) => existingVariant.id === variant.id)) {
        throw new StatregError(`Variant with id '${variant.id}' does not belong to statistic '${safeShortname}'.`)
      }
    }

    const missingExistingVariants = existingStatistic.variants?.filter(
      (existingVariant) => !parsedVariants.some((variant) => variant.id === existingVariant.id)
    )

    if (missingExistingVariants?.length) {
      throw new StatregError(
        `Deleting variants is currently not supported. Missing existing variant ids: ${missingExistingVariants
          .map((variant) => variant.id)
          .join(', ')}.`
      )
    }
  }

  if (status === 'A') {
    const contactCount = newContacts ? newContacts.length : existingStatistic.responsiblePersons.length
    const newVariantCount = parsedVariants?.filter((variant) => !variant.id).length ?? 0

    if (contactCount === 0) {
      throw new StatregError('An active statistic needs at least one contact.')
    }

    if (existingStatistic.variants.length + newVariantCount === 0) {
      throw new StatregError('An active statistic needs at least one variant.')
    }
  }

  const existingVariants = parsedVariants?.filter((variant) => variant.id) ?? []
  const newVariants = parsedVariants?.filter((variant) => !variant.id) ?? []

  const regionLevelsToRemove = existingStatistic.statistic_region_levels?.filter(
    (existingRegLvl) =>
      !statistic_region_levels?.find((incomingRegLvl) => incomingRegLvl === existingRegLvl.region_level.code)
  )
  const deleteRegionLevelStatement = regionLevelsToRemove?.map((regLvl) => {
    return {
      statistic_id_region_level_id: { statistic_id: existingStatistic.id, region_level_id: regLvl.region_level.id },
    }
  })

  const regionLevelsToAdd = statistic_region_levels.filter(
    (incomingRegLvl) =>
      incomingRegLvl.code &&
      !existingStatistic.statistic_region_levels?.find(
        (existingRegLvl) => incomingRegLvl === existingRegLvl.region_level.code
      )
  )
  const createRegionLevelStatement = regionLevelsToAdd.map((regLvl) => {
    return { region_level: { connect: { code: regLvl.code } } }
  })

  const statisticUpdateArgs = {
    where: { id: existingStatistic.id },
    data: {
      name,
      name_en,
      division_code: division,
      desk_appoval_status: ApprovalStatus.PENDING,
      status,
      comment,
      language: main_language,
      // New relations are canonical SA -> target writes. If this row owned the only legacy reverse
      // representation of an older SA -> this relation, that old pointer is cleared after the edge
      // is preserved canonically on the historical SA row below.
      ...(relationIdToWrite
        ? { related_statistic_id: relationIdToWrite }
        : clearRelationOnStatusChange || legacyReverseSourceIdToPreserve
          ? { related_statistic_id: null }
          : {}),
      legacy_topic_codes: previous_topic_codes,
      yearly_reporting,
      first_release: first_released_at,
      ...(newContacts && {
        responsiblePersons: {
          set: newContacts.map((contact) => ({ id: contact.id })),
        },
      }),
      ...(parsedVariants && {
        variants: {
          update: existingVariants.map((variant) => ({
            where: { id: variant.id! },
            data: {
              cancelled: variant.cancelled ?? false,
              revision: variant.revision!.code as string,
              frequency: {
                connect: {
                  code: variant.frequency!.code as string,
                },
              },
              level_of_detail: variant.level_of_detail?.name ?? null,
              level_of_detail_en: variant.level_of_detail?.name_en ?? null,
              last_updated: new Date(),
            },
          })),
          create: newVariants.map((variant) => ({
            cancelled: false,
            date_created: new Date(),
            last_updated: new Date(),
            revision: variant.revision!.code as string,
            frequency: {
              connect: {
                code: variant.frequency!.code as string,
              },
            },
            ...(variant.level_of_detail?.name ? { level_of_detail: variant.level_of_detail.name } : {}),
            ...(variant.level_of_detail?.name_en ? { level_of_detail_en: variant.level_of_detail.name_en } : {}),
          })),
        },
      }),
      statistic_region_levels: {
        create: createRegionLevelStatement,
        delete: deleteRegionLevelStatement,
      },
    },
    include: StatisticsDetailedIncludes,
  } satisfies Prisma.StatisticUpdateArgs

  const updatedStatistic = legacyReverseSourceIdToPreserve
    ? await (prisma as StatisticPrisma & Pick<PrismaClient, '$transaction'>).$transaction(async (tx) => {
        // Convert only the endangered legacy reverse edge. Both writes are atomic: either the old
        // history becomes canonical and this edit succeeds, or neither change is committed.
        await tx.statistic.update({
          where: { id: legacyReverseSourceIdToPreserve },
          data: { related_statistic_id: existingStatistic.id },
        })

        return tx.statistic.update(statisticUpdateArgs)
      })
    : await prisma.statistic.update(statisticUpdateArgs)

  return await mapStatisticDetails(updatedStatistic)
}

async function upsertContacts(principalNames: string[], prisma: StatisticPrisma): Promise<ResponsiblePersonPrisma[]> {
  const users = await getAllUsersFromCache()

  const uniquePrincipalNames = [...new Set(principalNames)]
  const knownPrincipalNames = uniquePrincipalNames.filter((principalName) => users[principalName])

  return await Promise.all(
    knownPrincipalNames.map((principalName) =>
      prisma.responsiblePerson.upsert({
        where: { principalName },
        create: { principalName },
        update: {},
      })
    )
  )
}

export async function updateStatisticContacts(
  shortname: string,
  newPrincipalNames: string[],
  prisma: StatisticPrisma
): Promise<Contact[]> {
  const safeShortname = sanitize(shortname)

  const existingStatistic = await prisma.statistic.findFirst({
    where: { shortname: { name: safeShortname } },
    select: { id: true, status: true },
  })
  if (!existingStatistic) {
    throw new StatregError(`Shortname '${safeShortname}' not found.`, 404)
  }

  const newContacts = await upsertContacts(newPrincipalNames, prisma)

  if (existingStatistic.status === 'A' && newContacts.length === 0) {
    throw new StatregError('An active statistic needs at least one contact.')
  }

  const updatedStatistic = await prisma.statistic.update({
    // https://docs.prisma.io/docs/orm/reference/prisma-client-reference#set
    where: { id: existingStatistic.id },
    data: {
      responsiblePersons: {
        set: newContacts.map((contact) => ({ id: contact.id })),
      },
      comment: 'User updated contacts',
    },
    select: { responsiblePersons: { select: { principalName: true } } },
  })

  const users = await getAllUsersFromCache()
  return updatedStatistic.responsiblePersons.map((person) => ({
    name: users[person.principalName]?.displayName ?? '',
    principalName: person.principalName,
  }))
}

export async function createStatistic(
  prisma: StatisticPrisma,
  shortname: string,
  body?: StatisticCreate,
  now = new Date()
): Promise<StatisticDetails> {
  const safeShortname = sanitize(shortname)

  await statisticsAsserts.assertShortnameExists(safeShortname, prisma)
  await statisticsAsserts.assertShortnameExistsAndIsAvailable(safeShortname, prisma)

  const createStatisticStatus = parseCreateStatisticStatus(body)
  const {
    division,
    name,
    name_en,
    first_released_at,
    main_language,
    statistic_region_levels = [],
    comment,
  } = parseCreateStatisticInput(body, createStatisticStatus)

  const statusCode = body?.status?.code

  let contacts
  if (body?.contacts) {
    contacts = await upsertContacts(body.contacts, prisma)

    if (statusCode === 'A' && contacts.length === 0) {
      throw new StatregError('An active statistic needs at least one contact.')
    }
  }

  const variants = await parseVariantsInput(body?.variants, statusCode, prisma)

  const result = await prisma.statistic.create({
    data: {
      name,
      ...(name_en ? { name_en } : {}),
      priority: 1,
      yearly_reporting: false,
      status: createStatisticStatus,
      desk_appoval_status: ApprovalStatus.ACCEPTED,
      language: main_language,
      date_created: now,
      last_updated: now,
      ...(first_released_at ? { first_release: first_released_at } : {}),
      comment: comment || `Create statistic with shortname: ${shortname}`,
      division_code: division,
      statistic_region_levels: {
        create: statistic_region_levels.map(({ code }) => ({
          region_level: { connect: { code } },
        })),
      },
      shortname: {
        connect: {
          name: safeShortname,
        },
      },
      ...(contacts && {
        responsiblePersons: {
          connect: contacts.map((contact) => ({ id: contact.id })),
        },
      }),
      ...(variants?.length
        ? {
            variants: {
              create: variants.map((variant) => ({
                cancelled: false,
                date_created: now,
                last_updated: now,
                revision: variant.revision!.code as string,
                frequency: {
                  connect: {
                    code: variant.frequency!.code as string,
                  },
                },
                ...(variant.level_of_detail?.name ? { level_of_detail: variant.level_of_detail.name } : {}),
                ...(variant.level_of_detail?.name_en ? { level_of_detail_en: variant.level_of_detail.name_en } : {}),
              })),
            },
          }
        : {}),
    },
    include: StatisticsDetailedIncludes,
  })
  return await mapStatisticDetails(result)
}

export function parseCreateStatisticStatus(body?: StatisticCreate): CreatableStatisticStatus {
  const statusCode = body?.status?.code

  if (statusCode === 'K' || statusCode === 'A') {
    return statusCode
  } else {
    throw new StatregError("Field 'status' must be one of these: K, A.")
  }
}

export async function parseVariantsInput(
  variants: Variant[] | undefined,
  status: string | undefined,
  prisma: StatisticPrisma
): Promise<Variant[] | undefined> {
  if (status === 'A' && !variants?.length) {
    throw new StatregError('An active statistic needs at least one variant.')
  }

  if (!variants?.length) {
    return undefined
  }

  return await Promise.all(
    variants.map(async (variant) => {
      const frequency = variant.frequency
      await statisticsAsserts.assertFrequencyExists(frequency?.code ?? '', prisma)

      const revision = variant.revision
      const revisionCodes = Object.keys(RevisionNames)
      if (!revisionCodes.includes(revision?.code ?? '')) {
        throw new StatregError(`Field 'revision' must be one of these: ${revisionCodes.join(', ')}.`)
      }

      return {
        ...(variant.id !== undefined ? { id: variant.id } : {}),
        frequency,
        revision,
        level_of_detail: variant.level_of_detail && {
          name: sanitize(variant.level_of_detail.name),
          name_en: sanitize(variant.level_of_detail.name_en),
        },
        cancelled: variant.cancelled ?? false,
      }
    })
  )
}

export function parseCreateStatisticInput(
  body: StatisticCreate | undefined,
  status: CreatableStatisticStatus
): ValidatedCreateStatisticInput {
  const requiredFields = RequiredCreateStatisticFieldsByStatus[status]
  const {
    division,
    name,
    name_en,
    first_released_at,
    main_language,
    statistic_region_levels = [],
    comment,
  } = ensureRequiredFieldsExists(body ?? {}, requiredFields)

  const safeName = sanitize(name)
  const safeNameEn = sanitize(name_en)
  const safeComment = sanitize(comment)
  const language = main_language ?? 'nb'

  if (!safeName) {
    throw new StatregError("Field 'name' must be a non-empty string.")
  }

  if (status === 'A' && !safeNameEn) {
    throw new StatregError("Field 'name_en' must be a non-empty string.")
  }

  if (language !== 'nb' && language !== 'nn') {
    throw new StatregError("Field 'main_language' must be either 'nb' or 'nn'.")
  }

  return {
    division: parseDivision(division),
    name: safeName,
    ...(safeNameEn ? { name_en: safeNameEn } : {}),
    ...(first_released_at ? { first_released_at: parseDateOnly(first_released_at, 'first_released_at') } : {}),
    statistic_region_levels,
    main_language: language,
    comment: safeComment,
  }
}

export function parseUpdateStatisticInput(
  body: StatisticUpdate | undefined,
  requiredFields: (keyof StatisticUpdate)[]
): ValidatedStatisticInput {
  const {
    division,
    statistic_region_levels,
    status,
    name,
    name_en,
    previous_topic_codes,
    yearly_reporting,
    first_released_at,
    main_language,
    comment,
    relation_id,
    contacts,
    variants,
  } = ensureRequiredFieldsExists(body, requiredFields)

  const safeName = sanitize(name)
  const safeNameEn = sanitize(name_en)
  const safeComment = sanitize(comment)

  if (!safeName) {
    throw new StatregError("Field 'name' must be a non-empty string.")
  }

  if (main_language !== 'nb' && main_language !== 'nn') {
    throw new StatregError("Field 'main_language' must be either 'nb' or 'nn'.")
  }

  const validatedInput = {
    division: parseDivision(division),
    name: safeName,
    name_en: safeNameEn,
    first_released_at: first_released_at ? parseDateOnly(first_released_at, 'first_released_at') : null,
    main_language,
    comment: safeComment,
  }

  if (typeof yearly_reporting !== 'boolean') {
    throw new StatregError("Field 'yearly_reporting' must be a boolean.")
  }

  if (!safeComment) {
    throw new StatregError("Field 'comment' must be a non-empty string.")
  }

  return {
    ...validatedInput,
    statistic_region_levels,
    status: parseStatusCode(status?.code),
    previous_topic_codes: sanitize(previous_topic_codes!),
    yearly_reporting: Boolean(yearly_reporting),
    ...(relation_id ? { relation_id: parseId(relation_id, 'relation') } : {}),
    comment: safeComment,
    ...(contacts ? { contacts } : {}),
    ...(variants ? { variants } : {}),
  }
}

export function parseDivision(division?: string | null) {
  if (!division || !isNumber(division)) {
    throw new StatregError("Field 'division' must be a number.")
  }

  if (!getDivisionFromCode(division)) {
    throw new StatregError("Field 'division' does not correspond to an existing division.")
  }

  return division.toString()
}

export function parseStatusCode(statusCode?: string): StatisticStatusCode {
  if (!statusCode || !Object.keys(StatisticStatus).includes(statusCode)) {
    throw new StatregError(`Field 'status' must be one of these: ${Object.keys(StatisticStatus).join(', ')}.`)
  }
  return statusCode as StatisticStatusCode
}
