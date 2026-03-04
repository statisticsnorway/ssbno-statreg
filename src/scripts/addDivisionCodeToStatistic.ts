// Run script in terminal with the following command:
// npx tsx ./src/scripts/addDivisionCodeToStatistic.ts

import { prisma } from '@/lib/prisma'

async function main() {
  console.log('Fetching statistics with related division...')

  const statistics = await prisma.statistic.findMany({
    include: {
      division: true, // Division_DoNotUse relation
    },
  })

  console.log(`Found ${statistics.length} statistics.\n`)

  let updated = 0

  for (const stat of statistics) {
    const division = stat.division

    // Skip if no division or already has manually injected division_code
    if (!division) {
      console.log(`Statistic ${stat.id} has no division. Skipped.`)
      continue
    }

    if (stat.division_code === division.code) {
      console.log(`Statistic ${stat.id} already correct. Skipped.`)
      continue
    }

    await prisma.statistic.update({
      where: { id: stat.id },
      data: { division_code: division.code },
    })

    updated++
  }

  console.log(`Done. Updated ${updated} statistics.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
