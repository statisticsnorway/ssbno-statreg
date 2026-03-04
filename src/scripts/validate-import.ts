// Run script in command line using: npx tsx ./src/scripts/validate-import.ts ./docs/database-migration/tableStatsExample.json

import { prisma } from '@/lib/prisma'
import fs from 'node:fs'
import path from 'node:path'

type TableMeta = {
  old_table_name: string
  new_table_name: string
  num_rows: number
  old_id_column_name: string
  id_low_value: number
  id_high_value: number
}

const metaPath = process.argv[2]

if (!metaPath) {
  console.error('Usage: ts-node scripts/validate-import.ts <path/to/tables.json>')
  process.exit(1)
}

const absMetaPath = path.resolve(metaPath)
if (!fs.existsSync(absMetaPath)) {
  console.error(`Metadata file not found: ${absMetaPath}`)
  process.exit(1)
}

const meta: TableMeta[] = JSON.parse(fs.readFileSync(absMetaPath, 'utf8'))

console.log('=== VALIDATION (DB) STARTED ===')

let failures = 0

// ---------------------------
// AUDITLOG (AuditLogOld)
// ---------------------------
console.log(`\nValidating: AuditLogOld`)
const auditlogMeta = meta.find((o) => o.new_table_name === 'AuditLogOld')

{
  const rows = await prisma.auditLogOld.count()
  const rowOk = rows === auditlogMeta!.num_rows

  const minRec = await prisma.auditLogOld.findMany({ take: 1, orderBy: { id: 'asc' } })
  const maxRec = await prisma.auditLogOld.findMany({ take: 1, orderBy: { id: 'desc' } })

  const min_id = minRec?.length && minRec[0] ? minRec[0].id : null
  const max_id = maxRec?.length && maxRec[0] ? maxRec[0].id : null

  const idOk = min_id === auditlogMeta!.id_low_value && max_id === auditlogMeta!.id_high_value

  if (!rowOk) {
    console.error(` - Row count FAIL: expected ${auditlogMeta!.num_rows}, got ${rows}`)
  }

  if (!idOk) {
    console.error(
      ` - ID range FAIL: expected ${auditlogMeta!.id_low_value}-${auditlogMeta!.id_high_value} but got ${min_id}-${max_id}`
    )
  }

  if (rowOk && idOk) {
    console.log(` ✔ AuditLogOld OK`)
  } else {
    console.error(` ❌ FAIL`)
    failures++
  }
}
// ---------------------------
// VALIDATING FREQUENCY
// ---------------------------
console.log(`\nValidating: Frequency`)
const freqMeta = meta.find((o) => o.new_table_name === 'Frequency')

{
  const rows = await prisma.frequency.count()
  let rowOk = rows === freqMeta!.num_rows

  const minRec = await prisma.frequency.findMany({ take: 1, orderBy: { id: 'asc' } })
  const maxRec = await prisma.frequency.findMany({ take: 1, orderBy: { id: 'desc' } })

  const min_id = minRec?.length && minRec[0] ? minRec[0].id : null
  const max_id = maxRec?.length && maxRec[0] ? maxRec[0].id : null

  const idOk = min_id === freqMeta!.id_low_value && max_id === freqMeta!.id_high_value

  if (!rowOk) console.error(` - Row count FAIL: expected ${freqMeta!.num_rows}, got ${rows}`)
  if (!idOk)
    console.error(
      ` - ID range FAIL: expected ${freqMeta!.id_low_value}-${freqMeta!.id_high_value} but got ${min_id}-${max_id}`
    )

  if (rowOk && idOk) console.log(` ✔ Frequency OK`)
  else {
    console.error(` ❌ FAIL`)
    failures++
  }
}

// ---------------------------
// CALENDER_DATE
// ---------------------------
console.log(`\nValidating: Calender_date`)
const calMeta = meta.find((o) => o.new_table_name === 'Calender_date')

{
  const rows = await prisma.calender_date.count()
  const rowOk = rows === calMeta!.num_rows

  const minRec = await prisma.calender_date.findMany({ take: 1, orderBy: { id: 'asc' } })
  const maxRec = await prisma.calender_date.findMany({ take: 1, orderBy: { id: 'desc' } })

  const min_id = minRec?.length && minRec[0] ? minRec[0].id : null
  const max_id = maxRec?.length && maxRec[0] ? maxRec[0].id : null

  const idOk = min_id === calMeta!.id_low_value && max_id === calMeta!.id_high_value

  if (!rowOk) console.error(` - Row count FAIL: expected ${calMeta!.num_rows}, got ${rows}`)
  if (!idOk)
    console.error(
      ` - ID range FAIL: expected ${calMeta!.id_low_value}-${calMeta!.id_high_value} but got ${min_id}-${max_id}`
    )

  if (rowOk && idOk) console.log(` ✔ Calender_date OK`)
  else {
    console.error(` ❌ FAIL`)
    failures++
  }
}

// ---------------------------
// CONTACT
// ---------------------------
console.log(`\nValidating: Contact_DoNotUse`)
const contactMeta = meta.find((o) => o.new_table_name === 'Contact_DoNotUse')

{
  const rows = await prisma.contact_DoNotUse.count()
  const rowOk = rows === contactMeta!.num_rows

  const minRec = await prisma.contact_DoNotUse.findMany({ take: 1, orderBy: { id: 'asc' } })
  const maxRec = await prisma.contact_DoNotUse.findMany({ take: 1, orderBy: { id: 'desc' } })

  const min_id = minRec?.length && minRec[0] ? minRec[0].id : null
  const max_id = maxRec?.length && maxRec[0] ? maxRec[0].id : null

  const idOk = min_id === contactMeta!.id_low_value && max_id === contactMeta!.id_high_value

  if (!rowOk) console.error(` - Row count FAIL: expected ${contactMeta!.num_rows}, got ${rows}`)
  if (!idOk)
    console.error(
      ` - ID range FAIL: expected ${contactMeta!.id_low_value}-${contactMeta!.id_high_value} but got ${min_id}-${max_id}`
    )

  if (rowOk && idOk) console.log(` ✔ Contact_DoNotUse OK`)
  else {
    console.error(` ❌ FAIL`)
    failures++
  }
}

// ---------------------------
// SHORTNAME
// ---------------------------
console.log(`\nValidating: Shortname`)
const shortMeta = meta.find((o) => o.new_table_name === 'Shortname')

{
  const rows = await prisma.shortname.count()
  const rowOk = rows === shortMeta!.num_rows

  const minRec = await prisma.shortname.findMany({ take: 1, orderBy: { id: 'asc' } })
  const maxRec = await prisma.shortname.findMany({ take: 1, orderBy: { id: 'desc' } })

  const min_id = minRec?.length && minRec[0] ? minRec[0].id : null
  const max_id = maxRec?.length && maxRec[0] ? maxRec[0].id : null

  const idOk = min_id === shortMeta!.id_low_value && max_id === shortMeta!.id_high_value

  if (!rowOk) console.error(` - Row count FAIL: expected ${shortMeta!.num_rows}, got ${rows}`)
  if (!idOk)
    console.error(
      ` - ID range FAIL: expected ${shortMeta!.id_low_value}-${shortMeta!.id_high_value} but got ${min_id}-${max_id}`
    )

  if (rowOk && idOk) console.log(` ✔ Shortname OK`)
  else {
    console.error(` ❌ FAIL`)
    failures++
  }
}

// ---------------------------
// RELEASE
// ---------------------------
console.log(`\nValidating: Release`)
const relMeta = meta.find((o) => o.new_table_name === 'Release')

{
  const rows = await prisma.release.count()
  const rowOk = rows === relMeta!.num_rows

  const minRec = await prisma.release.findMany({ take: 1, orderBy: { id: 'asc' } })
  const maxRec = await prisma.release.findMany({ take: 1, orderBy: { id: 'desc' } })

  const min_id = minRec?.length && minRec[0] ? minRec[0].id : null
  const max_id = maxRec?.length && maxRec[0] ? maxRec[0].id : null

  const idOk = min_id === relMeta!.id_low_value && max_id === relMeta!.id_high_value

  if (!rowOk) console.error(` - Row count FAIL: expected ${relMeta!.num_rows}, got ${rows}`)
  if (!idOk)
    console.error(
      ` - ID range FAIL: expected ${relMeta!.id_low_value}-${relMeta!.id_high_value} but got ${min_id}-${max_id}`
    )

  if (rowOk && idOk) console.log(` ✔ Release OK`)
  else {
    console.error(` ❌ FAIL`)
    failures++
  }
}

// ---------------------------
// REGION_LEVEL
// ---------------------------
console.log(`\nValidating: Region_level`)
const regionMeta = meta.find((o) => o.new_table_name === 'Region_level')

{
  const rows = await prisma.region_level.count()
  const rowOk = rows === regionMeta!.num_rows

  const minRec = await prisma.region_level.findMany({ take: 1, orderBy: { id: 'asc' } })
  const maxRec = await prisma.region_level.findMany({ take: 1, orderBy: { id: 'desc' } })

  const min_id = minRec?.length && minRec[0] ? minRec[0].id : null
  const max_id = maxRec?.length && maxRec[0] ? maxRec[0].id : null

  const idOk = min_id === regionMeta!.id_low_value && max_id === regionMeta!.id_high_value

  if (!rowOk) console.error(` - Row count FAIL: expected ${regionMeta!.num_rows}, got ${rows}`)
  if (!idOk)
    console.error(
      ` - ID range FAIL: expected ${regionMeta!.id_low_value}-${regionMeta!.id_high_value} but got ${min_id}-${max_id}`
    )

  if (rowOk && idOk) console.log(` ✔ Region_level OK`)
  else {
    console.error(` ❌ FAIL`)
    failures++
  }
}

// ---------------------------
// DIVISION (Old: SEKSJON)
// ---------------------------
console.log(`\nValidating: Division_DoNotUse`)
const divisionMeta = meta.find((o) => o.new_table_name === 'Division_DoNotUse')

{
  const rows = await prisma.division_DoNotUse.count()
  const rowOk = rows === divisionMeta!.num_rows

  const minRec = await prisma.division_DoNotUse.findMany({ take: 1, orderBy: { id: 'asc' } })
  const maxRec = await prisma.division_DoNotUse.findMany({ take: 1, orderBy: { id: 'desc' } })

  const min_id = minRec?.length && minRec[0] ? minRec[0].id : null
  const max_id = maxRec?.length && maxRec[0] ? maxRec[0].id : null

  const idOk = min_id === divisionMeta!.id_low_value && max_id === divisionMeta!.id_high_value

  if (!rowOk) {
    console.error(` - Row count FAIL: expected ${divisionMeta!.num_rows}, got ${rows}`)
  }

  if (!idOk) {
    console.error(
      ` - ID range FAIL: expected ${divisionMeta!.id_low_value}-${divisionMeta!.id_high_value} but got ${min_id}-${max_id}`
    )
  }

  if (rowOk && idOk) {
    console.log(` ✔  OK`)
  } else {
    console.error(` ❌ FAIL`)
    failures++
  }
}

// ---------------------------
// STATISTIC
// ---------------------------
console.log(`\nValidating: Statistic`)
const statMeta = meta.find((o) => o.new_table_name === 'Statistic')

{
  const rows = await prisma.statistic.count()
  const rowOk = rows === statMeta!.num_rows

  const minRec = await prisma.statistic.findMany({ take: 1, orderBy: { id: 'asc' } })
  const maxRec = await prisma.statistic.findMany({ take: 1, orderBy: { id: 'desc' } })

  const min_id = minRec?.length && minRec[0] ? minRec[0].id : null
  const max_id = maxRec?.length && maxRec[0] ? maxRec[0].id : null

  const idOk = min_id === statMeta!.id_low_value && max_id === statMeta!.id_high_value

  if (!rowOk) console.error(` - Row count FAIL: expected ${statMeta!.num_rows}, got ${rows}`)
  if (!idOk)
    console.error(
      ` - ID range FAIL: expected ${statMeta!.id_low_value}-${statMeta!.id_high_value} but got ${min_id}-${max_id}`
    )

  if (rowOk && idOk) console.log(` ✔ Statistic OK`)
  else {
    console.error(` ❌ FAIL`)
    failures++
  }
}
// ---------------------------
// STATISTIC_CONTACTS (ID = statistic_id)
// ---------------------------
console.log(`\nValidating: Statistic_contacts`)
const statcMeta = meta.find((o) => o.new_table_name === 'Statistic_contacts')

{
  const rows = await prisma.statistic_contacts.count()
  const rowOk = rows === statcMeta!.num_rows

  const minRec = await prisma.statistic_contacts.findMany({ take: 1, orderBy: { statistic_id: 'asc' } })
  const maxRec = await prisma.statistic_contacts.findMany({ take: 1, orderBy: { statistic_id: 'desc' } })

  const min_id = minRec?.length && minRec[0] ? minRec[0].statistic_id : null
  const max_id = maxRec?.length && maxRec[0] ? maxRec[0].statistic_id : null

  const idOk = min_id === statcMeta!.id_low_value && max_id === statcMeta!.id_high_value

  if (!rowOk) console.error(` - Row count FAIL: expected ${statcMeta!.num_rows}, got ${rows}`)
  if (!idOk)
    console.error(
      ` - ID range FAIL: expected ${statcMeta!.id_low_value}-${statcMeta!.id_high_value} but got ${min_id}-${max_id}`
    )

  if (rowOk && idOk) console.log(` ✔ Statistic_contacts OK`)
  else {
    console.error(` ❌ FAIL`)
    failures++
  }
}

// ---------------------------
// STATISTIC_REGION_LEVEL (ID = region_level_id)
// ---------------------------
console.log(`\nValidating: Statistic_region_level`)
const statrlMeta = meta.find((o) => o.new_table_name === 'Statistic_region_level')

{
  const rows = await prisma.statistic_region_level.count()
  const rowOk = rows === statrlMeta!.num_rows

  const minRec = await prisma.statistic_region_level.findMany({ take: 1, orderBy: { region_level_id: 'asc' } })
  const maxRec = await prisma.statistic_region_level.findMany({ take: 1, orderBy: { region_level_id: 'desc' } })

  const min_id = minRec?.length && minRec[0] ? minRec[0].region_level_id : null
  const max_id = maxRec?.length && maxRec[0] ? maxRec[0].region_level_id : null

  const idOk = min_id === statrlMeta!.id_low_value && max_id === statrlMeta!.id_high_value

  if (!rowOk) console.error(` - Row count FAIL: expected ${statrlMeta!.num_rows}, got ${rows}`)
  if (!idOk)
    console.error(
      ` - ID range FAIL: expected ${statrlMeta!.id_low_value}-${statrlMeta!.id_high_value} but got ${min_id}-${max_id}`
    )

  if (rowOk && idOk) console.log(` ✔ Statistic_region_level OK`)
  else {
    console.error(` ❌ FAIL`)
    failures++
  }
}

// ---------------------------
// VARIANT
// ---------------------------
console.log(`\nValidating: Variant`)
const variantMeta = meta.find((o) => o.new_table_name === 'Variant')

{
  const rows = await prisma.variant.count()
  const rowOk = rows === variantMeta!.num_rows

  const minRec = await prisma.variant.findMany({ take: 1, orderBy: { id: 'asc' } })
  const maxRec = await prisma.variant.findMany({ take: 1, orderBy: { id: 'desc' } })

  const min_id = minRec?.length && minRec[0] ? minRec[0].id : null
  const max_id = maxRec?.length && maxRec[0] ? maxRec[0].id : null

  const idOk = min_id === variantMeta!.id_low_value && max_id === variantMeta!.id_high_value

  if (!rowOk) console.error(` - Row count FAIL: expected ${variantMeta!.num_rows}, got ${rows}`)
  if (!idOk)
    console.error(
      ` - ID range FAIL: expected ${variantMeta!.id_low_value}-${variantMeta!.id_high_value} but got ${min_id}-${max_id}`
    )

  if (rowOk && idOk) console.log(` ✔ Variant OK`)
  else {
    console.error(` ❌ FAIL`)
    failures++
  }
}

console.log('\n=== VALIDATION (DB) COMPLETE ===')
await prisma.$disconnect()
if (failures) {
  console.error(` ❌ Some validation failed`)
} else {
  console.error(` ✔ All tables OK`)
}
