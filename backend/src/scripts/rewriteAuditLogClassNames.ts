// Run script in terminal with the following command:
// npx tsx ./src/scripts/rewriteAuditLogClassNames.ts

import { prisma } from '@/lib/prisma'

const CLASS_NAME_MAP: Record<string, string> = {
  'statistikkregisteret.Statistikk': 'Statistic',
  'statistikkregisteret.Variant': 'Variant',
  'statistikkregisteret.Publisering': 'Release',
  'statistikkregisteret.Kortnavn': 'Shortname',
  Statistikk: 'Statistic',
  Variant: 'Variant',
  Publisering: 'Release',
  Kortnavn: 'Shortname',
}

async function main() {
  console.log('Rewriting audit_log class_name values...\n')

  let totalUpdated = 0

  for (const [oldName, newName] of Object.entries(CLASS_NAME_MAP)) {
    const count = await prisma.auditLog.count({ where: { class_name: oldName } })

    if (count === 0) {
      console.log(`No records found with class_name "${oldName}". Skipped.`)
      continue
    }

    const result = await prisma.auditLog.updateMany({
      where: { class_name: oldName },
      data: { class_name: newName },
    })

    console.log(`"${oldName}" → "${newName}": updated ${result.count} records.`)
    totalUpdated += result.count
  }

  console.log(`\nDone. Total records updated: ${totalUpdated}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
