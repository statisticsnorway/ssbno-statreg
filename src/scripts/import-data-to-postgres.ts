/* eslint-disable no-unused-vars */
// Run with: npm exec tsx ./src/scripts/import-data-to-postgres.ts ~/Documents/STATREG_TABLES_JSON

import { prisma } from '../lib/prisma'
import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import JSONStream from 'JSONStream'

const BATCH_SIZE = 1000

// ---- Utilities --------------------------------------------------------------

async function deleteAllData() {
  console.log('⚠️ Deleting all existing data in FK-safe order...')

  // 1. Child / relation tables
  await prisma.release.deleteMany() // depends on Variant
  await prisma.statistic_contacts.deleteMany() // join table
  await prisma.statistic_region_level.deleteMany() // join table

  // 2. Dependent tables
  await prisma.variant.deleteMany() // depends on Frequency + Statistic
  await prisma.statistic.deleteMany() // depends on Shortname + Division

  // 3. Lookup / base tables
  await prisma.region_level.deleteMany()
  await prisma.division_DoNotUse.deleteMany()
  await prisma.shortname.deleteMany()
  await prisma.contact_DoNotUse.deleteMany()
  await prisma.calender_date.deleteMany()
  await prisma.frequency.deleteMany()
  await prisma.auditLogOld.deleteMany()

  // Optional: if you want to clear AUDIT_LOG manually:
  // await prisma.$executeRawUnsafe('DELETE FROM statreg."AUDIT_LOG"');

  console.log('✔ All tables emptied')
}

async function resetSequence(table: string, idColumn = 'id', schema = 'statreg') {
  const qualifiedTable = `"${schema}"."${table}"`

  const sql = `
    SELECT setval(
      pg_get_serial_sequence('${qualifiedTable}', '${idColumn}')::regclass,
      COALESCE((SELECT MAX(${idColumn})::bigint FROM ${qualifiedTable}), 0),
      true
    );
  `
  await prisma.$executeRawUnsafe(sql)
  console.log(`🔧 Sequence reset for ${schema}.${table}`)
}

function ensureFileExists(fullPath: string) {
  if (!fs.existsSync(fullPath)) {
    console.error(`ERROR: File not found: ${fullPath}`)
    process.exit(1)
  }
}

function toBool(value: any): boolean | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    if (['true', 't', '1', 'yes', 'y'].includes(v)) return true
    if (['false', 'f', '0', 'no', 'n'].includes(v)) return false
  }
  return undefined
}

// TODO: There's a bug so time is not with correct timezone, but MIM-2546 may change date formatting anyway so hence this is not fixed
function parseOsloDate(value: string): Date | undefined {
  if (!value) return undefined

  // match "DD.MM.YYYY HH.MM.SS,xxxxxxxxx"
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{2})\.(\d{2})\.(\d{2})/)

  if (!match) return undefined

  const [_, dd, mm, yyyy, HH, MM, SS] = match.map(Number)

  const year = yyyy
  const month = mm! - 1
  const day = dd
  const hour = HH
  const minute = MM
  const second = SS

  // 1. Create the naive UTC timestamp
  const naiveUtc = Date.UTC(year!, month, day, hour, minute, second)

  // 2. Ask Intl API what the offset is in Europe/Oslo at that time
  const localeString = new Date(naiveUtc).toLocaleString('en-US', {
    timeZone: 'Europe/Oslo',
    hour12: false,
  })

  const osloDate = new Date(localeString)
  return osloDate
}

async function runImportStream<T extends Record<string, any>>(
  filePath: string,
  pushBatch: (batch: T[]) => Promise<any>,
  mapFn: (raw: any) => T
) {
  const batch: T[] = []
  let count = 0

  await pipeline(fs.createReadStream(filePath), JSONStream.parse('results.*.items.*'), async function (source: any) {
    for await (const value of source) {
      const mapped = mapFn(value)
      batch.push(mapped)
      count++

      if (batch.length >= BATCH_SIZE) {
        await pushBatch(batch)
        console.log(`Inserted ${batch.length} from ${path.basename(filePath)} (total: ${count})`)
        batch.length = 0
      }
    }
  })

  if (batch.length > 0) {
    await pushBatch(batch)
    console.log(`Inserted final ${batch.length} from ${path.basename(filePath)} (total: ${count})`)
  }
}

// ============================================================================
// 1) FREKVENS  -> model Frequency
//    file: FREKVENS.json
// ============================================================================
type FrequencyCreate = Parameters<(typeof prisma)['frequency']['createMany']>[0]['data'] extends (infer U)[] ? U : never

function mapFrequency(raw: any): FrequencyCreate {
  return {
    id: Number(raw.id),
    version: Number(raw.version),
    name: String(raw.navn),
    name_en: '',
    code: String(raw.kode),
  } as FrequencyCreate
}

async function importFrequency(folder: string) {
  const file = path.join(folder, 'FREKVENS.json')
  ensureFileExists(file)
  console.log(`\n▶ Importing FREKVENS → Frequency from ${file}`)

  await runImportStream<FrequencyCreate>(
    file,
    (batch) =>
      prisma.frequency.createMany({
        data: batch,
        skipDuplicates: false,
      }),
    mapFrequency
  )

  console.log('✔ Done Frequency')
}

// ============================================================================
// 2) KALENDER_DATO -> model Calender_date
//    file: KALENDER_DATO.json
// ============================================================================
type CalenderDateCreate = Parameters<(typeof prisma)['calender_date']['createMany']>[0]['data'] extends (infer U)[]
  ? U
  : never

function mapCalenderDate(raw: any): CalenderDateCreate {
  return {
    id: Number(raw.id),
    version: Number(raw.version),
    comment: String(raw.kommentar),
    day: parseOsloDate(raw.dag)!,
  } as CalenderDateCreate
}

async function importCalenderDate(folder: string) {
  const file = path.join(folder, 'KALENDER_DATO.json')
  ensureFileExists(file)
  console.log(`\n▶ Importing KALENDER_DATO → Calender_date from ${file}`)

  await runImportStream<CalenderDateCreate>(
    file,
    (batch) =>
      prisma.calender_date.createMany({
        data: batch,
        skipDuplicates: false,
      }),
    mapCalenderDate
  )

  console.log('✔ Done Calender_date')
}

// ============================================================================
// 3) KONTAKT -> model Contact_DoNotUse
//    file: KONTAKT.json
// ============================================================================
type ContactCreate = Parameters<(typeof prisma)['contact_DoNotUse']['createMany']>[0]['data'] extends (infer U)[]
  ? U
  : never

function mapContact(raw: any): ContactCreate {
  return {
    id: Number(raw.id),
    version: Number(raw.version),
    initials: raw.initialer,
    mobile: raw.mobil,
    name: String(raw.navn),
    last_updated: parseOsloDate(raw.last_updated)!, // required
    phone: raw.telefon,
    email: String(raw.epost),
    date_created: parseOsloDate(raw.date_created)!, // required
    inactiv: toBool(raw.inaktiv),
    name_en: raw.navn_en ?? undefined,
  } as ContactCreate
}

async function importContact(folder: string) {
  const file = path.join(folder, 'KONTAKT.json')
  ensureFileExists(file)
  console.log(`\n▶ Importing KONTAKT → Contact_DoNotUse from ${file}`)

  await runImportStream<ContactCreate>(
    file,
    (batch) =>
      prisma.contact_DoNotUse.createMany({
        data: batch,
        skipDuplicates: false,
      }),
    mapContact
  )

  console.log('✔ Done Contact_DoNotUse')
}

// ============================================================================
// 4) KORTNAVN -> model Shortname
//    file: KORTNAVN.json
// ============================================================================
type ShortnameCreate = Parameters<(typeof prisma)['shortname']['createMany']>[0]['data'] extends (infer U)[] ? U : never

function mapShortname(raw: any): ShortnameCreate {
  return {
    id: Number(raw.id),
    version: Number(raw.version),
    name: String(raw.navn),
    last_updated: parseOsloDate(raw.last_updated)!, // required
    date_created: parseOsloDate(raw.date_created)!, // required
  } as ShortnameCreate
}

async function importShortname(folder: string) {
  const file = path.join(folder, 'KORTNAVN.json')
  ensureFileExists(file)
  console.log(`\n▶ Importing KORTNAVN → Shortname from ${file}`)

  await runImportStream<ShortnameCreate>(
    file,
    (batch) =>
      prisma.shortname.createMany({
        data: batch,
        skipDuplicates: false,
      }),
    mapShortname
  )

  console.log('✔ Done Shortname')
}

// ============================================================================
// 5) PUBLISERING -> model Release
//    file: PUBLISERING.json
// ============================================================================
type ReleaseCreate = Parameters<(typeof prisma)['release']['createMany']>[0]['data'] extends (infer U)[] ? U : never

function mapRelease(raw: any): ReleaseCreate {
  return {
    id: Number(raw.id),
    version: Number(raw.version),
    publish_time: parseOsloDate(raw.tidspunkt)!, // required
    has_versions: toBool(raw.has_versions ?? raw.har_versjoner) ?? false,
    last_updated: parseOsloDate(raw.last_updated)!, // required
    comment: String(raw.intern_kommentar),
    period_to: parseOsloDate(raw.periode_til)!, // required
    variant_id: Number(raw.variant_id), // FK → Variant
    period_from: parseOsloDate(raw.periode_fra)!, // required
    cancelled: toBool(raw.er_avlyst) ?? false,
    date_created: parseOsloDate(raw.date_created)!, // required
    release_date_precision: String(raw.datotype),
    import_flag: toBool(raw.import_flag),
  } as ReleaseCreate
}

async function importRelease(folder: string) {
  const file = path.join(folder, 'PUBLISERING.json')
  ensureFileExists(file)
  console.log(`\n▶ Importing PUBLISERING → Release from ${file}`)

  await runImportStream<ReleaseCreate>(
    file,
    (batch) =>
      prisma.release.createMany({
        data: batch,
        skipDuplicates: false,
      }),
    mapRelease
  )

  console.log('✔ Done Release')
}

// ============================================================================
// 6) REGIONALT_NIVA -> model Region_level
//    file: REGIONALT_NIVA.json
// ============================================================================
type RegionLevelCreate = Parameters<(typeof prisma)['region_level']['createMany']>[0]['data'] extends (infer U)[]
  ? U
  : never

function mapRegionLevel(raw: any): RegionLevelCreate {
  return {
    id: Number(raw.id),
    version: Number(raw.version),
    name: String(raw.name ?? raw.navn ?? ''),
    code: raw.code ?? raw.kode ?? undefined, // unique, nullable
  } as RegionLevelCreate
}

async function importRegionLevel(folder: string) {
  const file = path.join(folder, 'REGIONALT_NIVA.json')
  ensureFileExists(file)
  console.log(`\n▶ Importing REGIONALT_NIVA → Region_level from ${file}`)

  await runImportStream<RegionLevelCreate>(
    file,
    (batch) =>
      prisma.region_level.createMany({
        data: batch,
        skipDuplicates: false,
      }),
    mapRegionLevel
  )

  console.log('✔ Done Region_level')
}

// ============================================================================
// 7) SEKSJON -> model Division_DoNotUse
//    file: SEKSJON.json
// ============================================================================
type DivisionCreate = Parameters<(typeof prisma)['division_DoNotUse']['createMany']>[0]['data'] extends (infer U)[]
  ? U
  : never

function mapDivision(raw: any): DivisionCreate {
  return {
    id: Number(raw.id),
    version: Number(raw.version),
    code: String(raw.kode ?? ''),
    name_en: String(raw.navn_en),
    name: String(raw.navn),
  } as DivisionCreate
}

async function importDivision(folder: string) {
  const file = path.join(folder, 'SEKSJON.json')
  ensureFileExists(file)
  console.log(`\n▶ Importing SEKSJON → Division_DoNotUse from ${file}`)

  await runImportStream<DivisionCreate>(
    file,
    (batch) =>
      prisma.division_DoNotUse.createMany({
        data: batch,
        skipDuplicates: false,
      }),
    mapDivision
  )

  console.log('✔ Done Division_DoNotUse')
}

// ============================================================================
// 8) STATISTIKK -> model Statistic
//    file: STATISTIKK.json
// ============================================================================
type StatisticCreate = Parameters<(typeof prisma)['statistic']['createMany']>[0]['data'] extends (infer U)[] ? U : never

function mapStatistic(raw: any): StatisticCreate {
  return {
    id: Number(raw.id),
    version: Number(raw.version),
    shortname_id: Number(raw.kortnavn_id),
    dir_appoval_status: raw.dir_flyt,
    search_phrases: raw.triggerord,
    priority: Number(raw.prioritet),
    desk_appoval_status: raw.desk_flyt,
    language: String(raw.sprak),
    search_phrases_en: raw.triggerord_en,
    division_code: '',
    division_id: raw.eierseksjon_id, // FK → Division_DoNotUse
    first_release: parseOsloDate(raw.forstegangspublisering),
    yearly_reporting: toBool(raw.arsrapportering) ?? false,
    status: String(raw.status),
    relation_id: Number(raw.relation_id), // self-rel
    name: raw.statistikknavn,
    last_updated: parseOsloDate(raw.last_updated)!, // required
    comment: String(raw.intern_kommentar),
    name_en: raw.statistikknavn_en,
    date_created: parseOsloDate(raw.date_created)!, // required
    legacy_topic_codes: raw.gamle_emnekoder,
  } as StatisticCreate
}

async function importStatistic(folder: string) {
  const file = path.join(folder, 'STATISTIKK.json')
  ensureFileExists(file)
  console.log(`\n▶ Importing STATISTIKK → Statistic from ${file}`)

  await runImportStream<StatisticCreate>(
    file,
    (batch) =>
      prisma.statistic.createMany({
        data: batch,
        skipDuplicates: false,
      }),
    mapStatistic
  )

  console.log('✔ Done Statistic')
}

// ============================================================================
// 9) STATISTIKK_KONTAKTER -> model Statistic_contacts (join table)
//    file: STATISTIKK_KONTAKTER.json
// ============================================================================
type StatisticContactsCreate = Parameters<
  (typeof prisma)['statistic_contacts']['createMany']
>[0]['data'] extends (infer U)[]
  ? U
  : never

function mapStatisticContacts(raw: any): StatisticContactsCreate {
  return {
    statistic_id: Number(raw.statistikk_id),
    contact_id: Number(raw.kontakt_id),
    contacts_idx: raw.contacts_idx !== undefined ? Number(raw.kontakter_idx) : undefined,
  } as StatisticContactsCreate
}

async function importStatisticContacts(folder: string) {
  const file = path.join(folder, 'STATISTIKK_KONTAKTER.json')
  ensureFileExists(file)
  console.log(`\n▶ Importing STATISTIKK_KONTAKTER → Statistic_contacts from ${file}`)

  await runImportStream<StatisticContactsCreate>(
    file,
    (batch) =>
      prisma.statistic_contacts.createMany({
        data: batch,
        skipDuplicates: false,
      }),
    mapStatisticContacts
  )

  console.log('✔ Done Statistic_contacts')
}

// ============================================================================
// 10) STATISTIKK_REGIONALE_NIVAER -> model Statistic_region_level (join table)
//     file: STATISTIKK_REGIONALE_NIVAER.json
// ============================================================================
type StatisticRegionLevelCreate = Parameters<
  (typeof prisma)['statistic_region_level']['createMany']
>[0]['data'] extends (infer U)[]
  ? U
  : never

function mapStatisticRegionLevel(raw: any): StatisticRegionLevelCreate {
  return {
    region_level_id: Number(raw.regionalt_niva_id),
    statistic_id: Number(raw.statistikk_id),
  } as StatisticRegionLevelCreate
}

async function importStatisticRegionLevel(folder: string) {
  const file = path.join(folder, 'STATISTIKK_REGIONALE_NIVAER.json')
  ensureFileExists(file)
  console.log(`\n▶ Importing STATISTIKK_REGIONALE_NIVAER → Statistic_region_level from ${file}`)

  await runImportStream<StatisticRegionLevelCreate>(
    file,
    (batch) =>
      prisma.statistic_region_level.createMany({
        data: batch,
        skipDuplicates: false,
      }),
    mapStatisticRegionLevel
  )

  console.log('✔ Done Statistic_region_level')
}

// ============================================================================
// 11) VARIANT -> model Variant
//     file: VARIANT.json
// ============================================================================
type VariantCreate = Parameters<(typeof prisma)['variant']['createMany']>[0]['data'] extends (infer U)[] ? U : never

function mapVariant(raw: any): VariantCreate {
  return {
    id: Number(raw.id),
    version: Number(raw.version),
    last_updated: parseOsloDate(raw.last_updated)!, // required
    date_created: parseOsloDate(raw.date_created)!, // required
    cancelled: toBool(raw.er_opphort) ?? false,
    freq_id: Number(raw.frekvens_id), // FK → Frequency
    revision: String(raw.revisjon),
    statistic_id: Number(raw.statistikk_id), // FK → Statistic
    level_of_detail: raw.detaljniva,
    level_of_detail_en: raw.detaljniva_en,
  } as VariantCreate
}

async function importVariant(folder: string) {
  const file = path.join(folder, 'VARIANT.json')
  ensureFileExists(file)
  console.log(`\n▶ Importing VARIANT → Variant from ${file}`)

  await runImportStream<VariantCreate>(
    file,
    (batch) =>
      prisma.variant.createMany({
        data: batch,
        skipDuplicates: false,
      }),
    mapVariant
  )

  console.log('✔ Done Variant')
}

// ============================================================================
// 12) AUDIT_LOG -> NO Prisma model (raw SQL placeholder)
//     file: AUDIT_LOG.json
// ============================================================================
type AuditlogCreate = Parameters<(typeof prisma)['auditLogOld']['createMany']>[0]['data'] extends (infer U)[]
  ? U
  : never

function mapAuditlog(raw: any): AuditlogCreate {
  return {
    id: Number(raw.id),
    property_name: raw.property_name,
    last_updated: parseOsloDate(raw.last_updated)!,
    date_created: parseOsloDate(raw.date_created)!,
    old_value: raw.old_value,
    actor: raw.actor,
    uri: raw.uri,
    new_value: raw.new_value,
    persisted_object_version: Number(raw.persisted_object_version),
    class_name: raw.class_name,
    event_name: raw.event_name,
    persisted_object_id: Number(raw.persisted_object_id),
  } as AuditlogCreate
}

async function importAuditlog(folder: string) {
  const file = path.join(folder, 'AUDIT_LOG.json')
  ensureFileExists(file)
  console.log(`\n▶ Importing AUDITLOG → Auditlog from ${file}`)

  await runImportStream<AuditlogCreate>(
    file,
    (batch) =>
      prisma.auditLogOld.createMany({
        data: batch,
        skipDuplicates: false,
      }),
    mapAuditlog
  )

  console.log(`✔ Done AUDIT_LOG`)
}

// ============================================================================
// RESET/UPDATE all sequences
// ============================================================================

async function resetAllSequences() {
  console.log('\n▶ Resetting PostgreSQL sequences...')

  await resetSequence('Frequency')
  await resetSequence('Calender_date')
  await resetSequence('Contact_DoNotUse')
  await resetSequence('Shortname')
  await resetSequence('Division_DoNotUse')
  await resetSequence('Region_level')
  await resetSequence('Statistic')
  await resetSequence('Variant')
  await resetSequence('Release')
  await resetSequence('AuditLogOld')

  console.log('✔ All sequences updated\n')
}

// ============================================================================
// MAIN (explicit dependency-friendly order)
// Parents before children to satisfy FKs.
// ============================================================================
async function main() {
  const folder = process.argv[2]
  if (!folder) {
    console.error('Usage: pnpm tsx -r tsconfig-paths/register scripts/import-all.ts <folder>')
    process.exit(1)
  }

  // Order chosen for FK safety:
  await deleteAllData()
  await importFrequency(folder) // FREKVENS
  await importCalenderDate(folder) // KALENDER_DATO (independent)
  await importContact(folder) // KONTAKT
  await importShortname(folder) // KORTNAVN
  await importDivision(folder) // SEKSJON
  await importRegionLevel(folder) // REGIONALT_NIVA
  await importStatistic(folder) // STATISTIKK (needs shortname/division)
  await importVariant(folder) // VARIANT (needs frequency + statistic)
  await importRelease(folder) // PUBLISERING (needs variant)
  await importStatisticContacts(folder) // STATISTIKK_KONTAKTER (needs statistic + contact)
  await importStatisticRegionLevel(folder) // STATISTIKK_REGIONALE_NIVAER (needs both)
  await importAuditlog(folder) // AUDIT_LOG (raw SQL)

  console.log('\n🎉 All requested tables imported successfully (see notes about AUDIT_LOG).')

  resetAllSequences()
}

main()
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
  .finally(async () => {
    try {
      await prisma.$disconnect?.()
    } catch {
      console.log('Import script failed')
    }
  })
;``
