// Run script in terminal with the following command:
// npx tsx ./src/scripts/rewriteAuditLogEventNames.ts

import { prisma } from '@/lib/prisma'

const EVENT_NAME_MAP: Record<string, string> = {
  INSERT: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
}

async function main() {
  console.log('Rewriting audit_log event_name values...\n')

  let totalUpdated = 0

  for (const [oldName, newName] of Object.entries(EVENT_NAME_MAP)) {
    const count = await prisma.auditLog.count({ where: { event_name: oldName } })

    if (count === 0) {
      console.log(`No records found with event_name "${oldName}". Skipped.`)
      continue
    }

    const result = await prisma.auditLog.updateMany({
      where: { event_name: oldName },
      data: { event_name: newName },
    })

    console.log(`"${oldName}" -> "${newName}": updated ${result.count} records.`)
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
